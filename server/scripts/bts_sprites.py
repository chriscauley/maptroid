from _setup import get_world_from_argv
import os
from django.conf import settings
import imagehash
import numpy as np
import unrest_image as img

from maptroid.models import Room, SmileSprite, SpriteMatcher
from maptroid.utils import mkdir

def extract_sprites(image):
    pass

used = {}

_s = 16 # scale, px_per_block

_s3 = 3 # blocks are broken into 3x3 grid of points for computing "dots" of b_ sprites
_s2 = 2 # when blocks are combined, their points are multiplied by 2 so that their edges overlap

def print_dots(dots, replace=[0,4]):
    for row in dots:
        print(''.join([str(int(i)) if not i in replace else " " for i in row]))


point2str = lambda p: f'{p[0]},{p[1]}'
line2str = lambda line: '|'.join([point2str(p) for p in line])
print_lines = lambda lines: print("  ".join([line2str(line) for line in lines]))


def main():
    world = get_world_from_argv()
    BTS_DIR = os.path.join(settings.MEDIA_ROOT, f'smile_exports/{world.slug}/bts')
    sprite_matcher = SpriteMatcher()
    keys = os.listdir(BTS_DIR)
    for key in keys:
        room = Room.objects.get(world__slug=world.slug, key=key)
        if room.data.get('trash'):
            continue
        if 'bts' in room.data:
            pass # continue
        image = img._coerce(os.path.join(BTS_DIR, key), 'np')
        image = img.replace_color(image, (0,0,0,255), (0,0,0,0))
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

        # for solid blocks, remove rectangles with area > 4 until
        blocks = np.zeros((height, width))
        for sprite, x, y in shape_x_ys:
            if sprite.type == "b_0286": # solid block
                blocks[y,x] = 1

        blocks_display = np.copy(blocks)
        print_dots(blocks)
        rectangles = []
        i = 1
        while True:
            x1, y1, width, height = img.max_rect(blocks)
            if width * height >= 2:
                i += 1
                x2 = x1 + width
                y2 = y1 + height
                blocks[y1:y2,x1:x2] = 0
                blocks_display[y1:y2,x1:x2] = i

                # add rectangle to rectangles
                rectangles.append([x1, y1, width, height])

                # remove blocks that made rectangle from shape_x_ys
                not_in_rect = lambda x, y: x < x1 or x >= x2 or y < y1 or y >= y2
                shape_x_ys = [[s, x, y] for s, x, y in shape_x_ys if not_in_rect(x, y)]
                print(len(shape_x_ys), width * height, len(shape_x_ys) + width * height)
            else:
                break
        print_dots(blocks_display, replace=[0])

        room.data['bts'] = {
            'sprites': list(set([s.id for s, x, y in (shape_x_ys + special_x_ys)])),
            'shapes': [[s.type, [x, y]] for s, x, y in shape_x_ys],
            'rectangles': rectangles,
        }
        room.save()
        print('saving', room.name)
if __name__ == "__main__":
    main()