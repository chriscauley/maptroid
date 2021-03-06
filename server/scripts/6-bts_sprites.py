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

from maptroid.cre import scan_for_cre
from maptroid.models import Room, SmileSprite, SpriteMatcher
from maptroid.shapes import polygons_to_geometry
from maptroid.rectangle import xys_to_rectangles
from maptroid.utils import mkdir

def extract_sprites(image):
    pass

used = {}

_s = 16 # scale, px_per_block

_s3 = 3 # blocks are broken into 3x3 grid of points for computing "dots" of b_ sprites
_s2 = 2 # when blocks are combined, their points are multiplied by 2 so that their edges overlap

point2str = lambda p: f'{p[0]},{p[1]}'
line2str = lambda line: '|'.join([point2str(p) for p in line])
print_lines = lambda lines: print("  ".join([line2str(line) for line in lines]))


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


def main():
    world, zones, rooms = get_wzr()
    BTS_DIR = os.path.join(settings.MEDIA_ROOT, f'smile_exports/{world.slug}/bts')
    sprite_matcher = SpriteMatcher()
    keys = os.listdir(BTS_DIR)
    for i_key, key in enumerate(keys):
        room = Room.objects.get(world__slug=world.slug, key=key)
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

        room.data['geometry']['inner'] = polygons_to_geometry(polygons, isolations)

        room.data['bts'] = {
            'sprites': list(set([s.id for s, x, y in (shape_x_ys + special_x_ys)])),
        }
        hex_xys = defaultdict(list)
        cre_xys = defaultdict(list)
        for sprite, x, y in special_x_ys:
            if sprite.category == 'block':
                cre_xys[sprite.type].append([x, y])
            if sprite.category == 'hex':
                hex_xys[sprite.type].append([x, y])

        # scan layer 1 for blocks that don't appear in cre
        for key, value in scan_for_cre(room).items():
            cre_xys[key] = cre_xys[key] + value
        room.data['cre'] = {}
        taken_xys = []
        for key, xys in cre_xys.items():
            if xys:
                room.data['cre'][key] = xys_to_rectangles(xys)
                for xy in xys:
                    taken_xys.append(xy)
        room.data['cre_hex'] = {}
        for key, xys in hex_xys.items():
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