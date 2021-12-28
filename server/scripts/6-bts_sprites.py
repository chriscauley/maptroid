from _setup import get_world_from_argv
import os
from django.conf import settings
import numpy as np
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union
import sys
import unrest_image as img

from maptroid.models import Room, SmileSprite, SpriteMatcher
from maptroid.shapes import polygons_to_geometry
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
    world = get_world_from_argv()
    BTS_DIR = os.path.join(settings.MEDIA_ROOT, f'smile_exports/{world.slug}/bts')
    sprite_matcher = SpriteMatcher()
    keys = os.listdir(BTS_DIR)
    for key in keys:
        room = Room.objects.get(world__slug=world.slug, key=key)
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
        for y in range(height):
            for x in range(width):
                cropped = image[y*_s:(y+1)*_s,x*_s:(x+1)*_s,:]
                if not np.sum(cropped):
                    continue
                sprite, new = sprite_matcher.get_or_create_from_image(cropped, 'bts')
                if new:
                    print('New sprite', sprite)
                if sprite.type.startswith('b_'):
                    shape_x_ys.append([sprite, x, y])
                else:
                    special_x_ys.append([sprite, x, y])



        polygons = []
        for shape, x, y in shape_x_ys:
            # type is a series of indexes 0-8 indicating points on a 2d grid
            # x(0,3,6)=0,  x(1,4,7)=0.5, x(2,5,8)=1
            # y(0,1,2)=0,  y(3,4,5)=0.5, y(6,7,8)=1
            indexes = [int(i) for i in shape.type[2:]]
            points = [[x + (i % 3) / 2, y + int(i / 3) / 2] for i in indexes]
            points = [[x / 16, y / 16] for x, y in points]
            polygons.append(Polygon(points))

        room.data['geometry']['inner'] = polygons_to_geometry(polygons)

        room.data['bts'] = {
            'sprites': list(set([s.id for s, x, y in (shape_x_ys + special_x_ys)])),
        }
        room.save()
        print('saving', room.name)
if __name__ == "__main__":
    main()