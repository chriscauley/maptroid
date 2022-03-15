import cv2
import functools
import numpy as np
import os
import urcv

from maptroid.icons import get_icons, SM_DIR

@functools.lru_cache
def list_worlds():
    return [
        f.stem
        for f in (SM_DIR / 'world_doors').iterdir()
    ]

@functools.lru_cache
def get_door_icons(world, style):
    if not world in list_worlds():
        return get_door_icons('super_metroid', style)
    left = get_icons('colored-doors', source=f"world_doors/{world}.png")
    if not style in ['cap', 'half', 'halfcan', 'can', 'full']:
        raise ValueError(f"unrecognized door style: {style}")

    # cut in half for any of these
    if style in ['cap', 'half', 'halfcan']:
        left = {
            color: icon[:,0:16].copy()
            for color, icon in left.items()
        }

    # blackout can for caps
    if style == 'cap':
        for icon in left.values():
            icon[:, 8:] = [0,0,0,0]

    # black out cap for cans
    if style in ['can', 'halfcan']:
        for icon in left.values():
            icon[:, :8] = [0,0,0,0]

    def _rotate(angle):
        return {
            color: cv2.rotate(icon, angle)
            for color, icon in left.items()
        }
    return {
        'left': left,
        'right': _rotate(cv2.ROTATE_180),
        'up': _rotate(cv2.ROTATE_90_CLOCKWISE),
        'down': _rotate(cv2.ROTATE_90_COUNTERCLOCKWISE),
    }

@functools.lru_cache
def get_gray_door_icons(world):
    icons = get_door_icons(world, 'half')
    return {
        orientation: cv2.cvtColor(icons_by_color['blue'], cv2.COLOR_BGR2GRAY)
        for orientation, icons_by_color in icons.items()
    }


@functools.lru_cache
def get_door_colors(world):
    cap_icons = get_door_icons(world, 'cap')
    color_map = {}
    for color, icon in cap_icons['left'].items():
        color_map[color.replace('cap_', '')] = urcv.top_color(icon)
    return color_map

def match_door_color(image, world):
    door_colors = get_door_colors(world)
    top_color = urcv.top_color(image, exclude=((0,0,0),(21,21,21)))
    max_distance = 255*3
    match = None
    for name, color in door_colors.items():
        distance = sum([abs(int(c1)-int(c2)) for c1, c2 in zip(top_color, color)])
        if distance < max_distance:
            max_distance = distance
            match = name
    return match

def find_doors(image, world):
    gray_icons = get_gray_door_icons(world)
    matched_doors = {}
    gray = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
    for key, template in gray_icons.items():
        orientation = key.replace("door_", "")
        xys = urcv.template.match(gray, template, threshold=0.85)
        th, tw = template.shape
        for x,y in xys:
            x = x * 16
            y = y * 16
            door = image[y:y+th,x:x+tw]
            color = match_door_color(door, world)

            matched_doors[(x, y)] = [int(x/16), int(y/16), orientation, color]
    return matched_doors

def draw_doors(image, doors, world, offset=[0, 0]):
    rotated_caps = get_door_icons(world, 'full')
    image = urcv.force_alpha(image)

    for x, y, orientation, color in doors:
        dx = dy = 0
        if orientation == 'right':
            dx = -1
        if orientation == 'down':
            dy = -1
        cap = rotated_caps[orientation][color]
        urcv.draw.paste_alpha(image, cap, 16*(x+offset[0]+dx), 16*(y+offset[1]+dy))
    return image

def populate_room_doors(room):
    world = room.world
    matched_doors = {}
    for layer_name in ['layer-1', 'plm_enemies']:

        path = f'.media/smile_exports/{world.slug}/{layer_name}/{room.key}'
        if not os.path.exists(path):
            print(f'skipping {layer_name} for {room.key}')
            continue
        layer = cv2.imread(path)

        # plm_enemies will have vanilla door caps
        world_slug = world.slug if layer_name == 'layer-1' else 'super_metroid'

        matched_doors.update(find_doors(layer, world=world_slug))
    all_doors = list(matched_doors.values())
    room.data['doors'] = []
    for door in all_doors:
        room_x = door[0] // 16
        room_y = door[1] // 16
        if [room_x, room_y] not in room.data.get('holes', []):
            room.data['doors'].append(door)
