from _setup import get_wzr
from collections import defaultdict
import cv2
from django.conf import settings
import numpy as np
import os
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union
import sys
import unrest_image as img
import urcv

from maptroid.cre import scan_for_cre
from maptroid.icons import get_icons
from maptroid.models import Room, SmileSprite, SpriteMatcher
from maptroid.shapes import polygons_to_geometry
from maptroid.rectangle import xys_to_rectangles
from maptroid.utils import mkdir, CRE_COLORS

# used to look up cre colors from names.
# Colors were halved during processing because of 50% alpha
CRE_REVERSE_COLORS = {
    str(v).replace('255', '128'): k
    for k, v in CRE_COLORS.items()
}

def extract_sprites(image):
    pass

used = {}

_s = 16 # scale, px_per_block

_s3 = 3 # blocks are broken into 3x3 grid of points for computing "dots" of b_ sprites
_s2 = 2 # when blocks are combined, their points are multiplied by 2 so that their edges overlap

point2str = lambda p: f'{p[0]},{p[1]}'
line2str = lambda line: '|'.join([point2str(p) for p in line])
print_lines = lambda lines: print("  ".join([line2str(line) for line in lines]))

_op = dict(brightness=50, contrast=20, multiply=(0,0,1,1))
MAP_OPERATIONS = {
    'shot': _op,
    'crumble':_op,
    'bomb': _op,
    'missile': _op,
    'super-missile': _op,
    'power-bomb': _op,
    'speed-booster': _op,
    'grapple': _op,
    'spike': _op,
    'conveyor': _op,
}



# Failed attempat at only using interior walls, leaving it in for now
def filter_interior_walls(shape_x_ys):
    walls = np.zeros((height, width))
    for shape, x, y in shape_x_ys:
        if shape.type == 'b_0286': # solid block; see note on shape type below
            walls[y, x] = 2 # maybe keep
        else:
            walls[y, x] = 1 # definitely keep

    def get(x, y):
        if x >= 0 and x < width and y >= 0 and y < height:
            return walls[y,x]

    dxys = [
        [1,0], # r
        [0,1], # u
        [-1,0], # l
        [0,-1], # d
        [1,-1], # ur
        [-1,1], # ul
        [-1,-1], # dl
        [1,-1], # dr
    ]
    for y in range(height):
        for x in range(width):
            if not walls[y,x]:
                continue
            for dx, dy in dxys:
                value = get(x+dx, y + dy)
                if value == 0:
                    walls[y, x] = 1
                    break

    return [[s,x,y] for s,x,y in shape_x_ys if walls[y,x] ==1 ]


def auto_cre(room, cre_xys, hex_xys):
    icons = {
        **get_icons('block', operations=MAP_OPERATIONS),
        **get_icons('block-alt', operations=MAP_OPERATIONS),
        **get_icons('misc-spikes', operations=MAP_OPERATIONS),
    }
    icons['spike'] = icons['spike_up']
    path = os.path.join(settings.SINK_DIR, f"{room.world.slug}/bts-extra/{room.key}")
    if not os.path.exists(path):
        return
    bts_image = cv2.imread(path)
    final_canvas = cv2.cvtColor(bts_image.copy(), cv2.COLOR_BGR2BGRA)
    final_canvas[:] = 0
    H, W = bts_image.shape[:2]

    # auto_cre can only replace xys with "unknown" or "respawn"
    allowed_xys = {}
    for type_ in ["unknown", "respawn"]:
        for xy in hex_xys[type_]:
            allowed_xys[tuple(xy)] = True

    # do not write over any alredy described xys (SMILE will lable speed booster as crumble, etc)
    forbidden_xys = {}
    for xys in cre_xys.values():
        for xy in xys:
            forbidden_xys[tuple(xy)] = True

    for x in range(W//16):
        for y in range(H//16):
            pixel = bts_image[y*16+1,x*16+1]
            square = bts_image[y*16:(y+1)*16,x*16:(x+1)*16]
            if np.sum(pixel) == 0:
                if np.sum(square) != 0:
                    # This is just a check to make sure we can just go off the top pixel
                    # this works because the center of the bts box should be black
                    print(path, x, y)
                    raise ValueError(f"pixel-square mismatch: {np.sum(square)}")
                continue
            xy = (x, y)
            if xy not in allowed_xys:
                continue
            if xy in forbidden_xys:
                continue
            cre = CRE_REVERSE_COLORS.get(str(tuple(pixel)))
            if cre in [None, 'vertical']:
                continue
            urcv.draw.paste(final_canvas, icons[cre], x*16, y*16)
    if not os.path.exists(f".media/sm_cache/{room.world.slug}/bts-extra/"):
        os.mkdir(f".media/sm_cache/{room.world.slug}/bts-extra/")
    out_path = f".media/sm_cache/{room.world.slug}/bts-extra/{room.key}"
    room.data['bts-extra'] = f"/media/sm_cache/{room.world.slug}/bts-extra/{room.key}"
    cv2.imwrite(out_path, final_canvas)

def main():
    world, zones, rooms = get_wzr(exclude_hidden='--include-hidden' not in sys.argv)
    BTS_DIR = os.path.join(settings.SINK_DIR, f'{world.slug}/bts')
    sprite_matcher = SpriteMatcher()
    keys = os.listdir(BTS_DIR)
    for i_key, key in enumerate(keys):
        if not key.endswith('png'):
            continue
        try:
            room = Room.objects.get(world__slug=world.slug, key=key)
        except Exception as e:
            print("missing key: ",key)
            raise e
        if not room in rooms:
            continue
        if room.data.get('trash'):
            continue
        if 'bts' in room.data and not '-f' in sys.argv:
            continue
        room.data.pop('shapes', None)
        room.save()
        image = img._coerce(os.path.join(BTS_DIR, key), 'np')
        image = img.replace_color(image, (0,0,0,255), (0,0,0,0))
        if not room.data.get('geometry_override'):
            image = img.make_holes(image, room.data['holes'])
        height, width = [int(i / _s) for i in image.shape[:2]]
        shape_x_ys = []
        special_x_ys = []
        items = room.item_set.all()
        item_xys = [i.data['room_xy'] for i in items if not i.data.get('hidden')]
        for y in range(height):
            for x in range(width):
                cropped = image[y*_s:(y+1)*_s,x*_s:(x+1)*_s,:]
                if not np.sum(cropped):
                    continue
                if [x,y] in item_xys:
                    continue
                sprite, new = sprite_matcher.get_or_create_from_image(cropped, 'bts')
                if new:
                    print('New sprite', sprite)
                if sprite.type.startswith('b25_') or sprite.type.startswith('b16_'):
                    shape_x_ys.append([sprite, x, y])
                else:
                    special_x_ys.append([sprite, x, y])


        BLOCK_SPRITE = SmileSprite.objects.filter(type='b25_04ok0')[0]
        for [x, y, w, h, shape] in room.data.get('cre_overrides', []):
            if shape != 'block':
                continue
            for dx in range(w):
                for dy in range(h):
                    shape_x_ys.append([BLOCK_SPRITE, x+dx, y+dy])

        polygons = [Polygon(sprite_to_xys(shape, x, y)) for shape, x, y in shape_x_ys]

        # cut out some plm_overrides
        isolations = []
        for sxy, slug in room.data.get('plm_overrides', {}).items():
            x, y = [int(i) for i in sxy.split(',')]
            if slug == 'save-station':
                isolations.append([(x,y), (x+2,y), (x+2, y+0.5), (x,y+0.5)])
            if slug == 'elevator-platform':
                isolations.append([(x,y), (x+2,y), (x+2, y+0.5), (x,y+0.5)])
            if slug == 'ship':
                isolations.append([(x+5,y+0.5), (x+7,y+0.5), (x+7, y+1), (x+5,y+1)])
        # scale the isolations
        isolations = [[(x / 16, y / 16) for x, y in shape] for shape in isolations]

        room.data['geometry']['inner'] = polygons_to_geometry(
            polygons,
            isolations,
            external=room.data.get('geometry_override'),
        )

        room.data['bts'] = {
            'sprites': list(set([s.id for s, x, y in (shape_x_ys + special_x_ys)])),
        }
        hex_xys = defaultdict(list)
        cre_xys = defaultdict(list)
        for sprite, x, y in special_x_ys:
            if sprite.category == 'block':
                cre_xys[sprite.type].append([x, y])
            if sprite.category == 'hex':
                screen_x = x // 16
                screen_y = y // 16
                if [screen_x, screen_y] in room.data['holes']:
                    # the gemetry override makes it necessary to remove holes
                    # we want the blocks to appear but not the hexes (cres)
                    continue
                hex_xys[sprite.type].append([x, y])

        # scan layer 1 for blocks that don't appear in cre
        for key, value in scan_for_cre(room).items():
            cre_xys[key] = cre_xys[key] + value
        room.data['cre'] = {}
        taken_xys = []
        auto_cre(room, cre_xys, hex_xys)
        for key, xys in cre_xys.items():
            if not key:
                raise ValueError("Key does not exist. Assign value at /app/smilesprite")
            if xys:
                room.data['cre'][key] = xys_to_rectangles(xys)
                for xy in xys:
                    taken_xys.append(xy)
        room.data['cre_hex'] = {}
        for key, xys in hex_xys.items():
            if not key:
                raise ValueError("Key does not exist. Assign value at /app/smilesprite")
            xys = [xy for xy in xys if not xy in taken_xys]
            if xys:
                room.data['cre_hex'][key] = xys_to_rectangles(xys)
        room.save()
        print(f'{i_key+1} / {len(keys)} saving #{room.id} {room.name or ""}')

"""
b16_
0123
4567
89ab
cdef

b25_
01234
56789
abcde
fghij
klmno
"""

def sprite_to_xys(sprite, x, y):
    _hex = '0123456789abcdefghijklmno'
    prefix, hexes = sprite.type.split('_')
    indexes = [_hex.index(h) for h in hexes]
    if prefix == 'b25':
        points = [[x + (i % 5) / 4, y + int(i / 5) / 4] for i in indexes]
    elif prefix == 'b16':
        points = [[x + (i % 4) / 3, y + int(i / 4) / 3] for i in indexes]
    else:
        raise ValueError('unknown prefix: '+prefix)
    return [[x / 16, y / 16] for x, y in points]


if __name__ == "__main__":
    main()
