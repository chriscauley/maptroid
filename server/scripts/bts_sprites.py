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

class Shape():
    left_point = None
    right_point = None
    points = None
    def __init__(self, first_line):
        self.left_point, self.right_point = self.points = first_line
    def test_and_add_line(self, line):

        # first check against left point
        if self.left_point == line[0]:
            self.add_point_to_left_side(line[1])
        elif self.left_point == line[1]:
            self.add_point_to_left_side(line[0])

        # then check right point
        elif self.right_point == line[0]:
            self.add_point_to_right_side(line[1])
        elif self.right_point == line[1]:
            self.add_point_to_right_side(line[0])

        # neigther matched, return false
        else:
            return False
        return True

    def add_point_to_right_side(self, point):
        self.points.append(point)
        self.right_point = point

    def add_point_to_left_side(self, point):
        self.points.insert(0, point)
        self.left_point = point

    @property
    def is_closed(self):
        return self.left_point == self.right_point

    def cleanup(self):
        remove = []
        for i in range(len(self.points) - 2):
            print(i, len(self.points))
            a, b, c = self.points[i:i+3]
            if (a[0] + c[0]) /2 == b[0] and (a[1] + c[1]) /2 == b[1]:
                remove.append(b)
        for p in remove:
            self.points.remove(p)

def print_dots(dots, replace=[0,4]):
    for row in dots:
        print(''.join([str(int(i)) if not i in replace else " " for i in row]))


point2str = lambda p: f'{p[0]},{p[1]}'
line2str = lambda line: '|'.join([point2str(p) for p in line])
print_lines = lambda lines: print("  ".join([line2str(line) for line in lines]))


# TODO this is a failed attempt at merging the shapes into larger shapes. May come back to it.
def DEP_sprites_to_shapes(sprite_x_ys, width, height):
    if True:
        # This is useful for getting a sub section of the image
        i_min = 3
        i_max = 9
        sprite_x_ys = [sxy for sxy in sprite_x_ys if sxy[1] < i_max and sxy[2] < i_max]
        sprite_x_ys = [sxy for sxy in sprite_x_ys if sxy[1] > i_min and sxy[2] > i_min]
        width = height = i_max+1

    dots = np.zeros(shape=(height * _s2+1, width * _s2+1))
    for sprite, x, y in sprite_x_ys:
        x = _s2*x
        y = _s2*y
        points = [[int(i) % _s3, int(int(i) / _s3)] for i in sprite.type[2:]]
        if type not in used:
            used[type] = True
        for dx, dy in points:
            dots[y+dy,x+dx] += 1

    print_dots(dots)

    lines = []
    for sprite, sx, sy in sprite_x_ys:
        hx = _s2*sx
        hy = _s2*sy
        points = [[int(i) % _s3+hx, int(int(i) / _s3)+hy] for i in sprite.type[2:]]
        last_point = points[-1]
        for point in points:
            point = [point[0], point[1]]
            px, py = point
            if dots[py,px] % 4: # TODO something isn't lining up here
                if dots[last_point[1], last_point[0]] %4:
                    lines.append([last_point, point])
            last_point = point

    shapes = []
    while len(lines) != 0:
        shape = Shape(lines.pop(0))
        shapes.append(shape)
        while not shape.is_closed:
            remove = []
            for line in lines:
                if shape.test_and_add_line(line):
                    remove.append(line)
                    if shape.is_closed:
                        break
            for line in remove:
                lines.remove(line)
            if not remove:
                raise ValueError("shape is unclosed and no new lines could be added")
        shape.cleanup()
    return [[p[0]/_s2, p[1]/_s2] for p in shape.points]


def sprites_to_shapes(sprite_x_ys):
    for sprite, x, y in sprite_x_ys:
        dxys = [[(int(i) % 3) / 2, int(int(i) / 3) / 2] for i in sprite.type[2:]]
        points = [[dx, dy] for dx, dy in dxys]
        print(sprite.type, points)


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
        sprite_x_ys = []
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
                    sprite_x_ys.append([sprite, x, y])
                else:
                    special_x_ys.append([sprite, x, y])

        # for solid blocks, remove rectangles with area > 4 until
        blocks = np.zeros((height, width))
        for sprite, x, y in sprite_x_ys:
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

                # remove blocks that made rectangle from sprite_x_ys
                not_in_rect = lambda x, y: x < x1 or x >= x2 or y < y1 or y >= y2
                sprite_x_ys = [[s, x, y] for s, x, y in sprite_x_ys if not_in_rect(x, y)]
                print(len(sprite_x_ys), width * height, len(sprite_x_ys) + width * height)
            else:
                break
        print_dots(blocks_display, replace=[0])

        room.data['bts'] = {
            'sprites': list(set([s.id for s, x, y in (sprite_x_ys + special_x_ys)])),
            'shapes': [[s.type, [x, y]] for s, x, y in sprite_x_ys],
            'rectangles': rectangles,
        }
        room.save()
        print('saving', room.name)
if __name__ == "__main__":
    main()