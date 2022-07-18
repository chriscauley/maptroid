import cv2
import functools
import numpy as np
import os
import urcv

from maptroid.icons import get_icons, SM_DIR, ROTATIONS

@functools.lru_cache
def list_worlds():
    return [
        f.stem
        for f in (SM_DIR / 'world_doors').iterdir()
    ]

@functools.lru_cache
def get_door_icons(world, style):
    if not world in list_worlds():
        return get_door_icons('super-metroid', style)
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

@functools.lru_cache
def get_override_doors(world):
    world_doors = cv2.imread(f'static/sm/override_doors/{world}_doors.png')
    out = []
    for y_offset in range(world_doors.shape[0] // 64):
        blue_left = get_door_icons(world, 'full')['left']['blue']
        world_left = world_doors[y_offset:y_offset+64]
        doorset = [(
            cv2.cvtColor(blue_left, cv2.COLOR_BGRA2GRAY),
            cv2.cvtColor(world_left, cv2.COLOR_BGRA2GRAY),
            blue_left[:,:,:3],
        )]
        for rotate in [90, 180, 270]:
            doorset.append([cv2.rotate(i, ROTATIONS[rotate]) for i in doorset[0]])
        out.append(doorset)
    return out

def find_doors(image, world, room_id):
    # one room in hydellius has a very bizarre door
    if room_id == 5135 and world == 'hydellius':
        door = get_door_icons(world, 'full')['right']['blue']
        door = cv2.cvtColor(door, cv2.COLOR_BGRA2BGR)
        urcv.draw.paste(image, door, 0, 96)
        cv2.imwrite('.media/trash/doot.png', image)

    gray_icons = get_gray_door_icons(world)
    matched_doors = {}
    gray = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)

    # more weird doors by TROM!
    override_doors = []
    if world == 'new-wet-dream' or world == 'hydellius':
        override_doors = get_override_doors(world)
    for doorset in override_doors:
        for blue_gray, red_gray, blue in doorset:
            for x, y, _x2, _y2 in urcv.template.match(gray, red_gray, threshold=0.8):
                urcv.draw.paste(image, blue, x, y)
                gray = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
    for key, template in gray_icons.items():
        orientation = key.replace("door_", "")
        xywhs = urcv.template.match(gray, template, threshold=0.85)
        th, tw = template.shape
        for x, y, w, h in xywhs:
            door = image[y:y+th,x:x+tw]
            if world in ['hydellius']:
                # hydellius' layer-1 is very messed up because there's not much color
                color = 'blue'
            else:
                color = match_door_color(door, world)
            x = round(x / 16)
            y = round(y / 16)

            matched_doors[(x, y)] = [x, y, orientation, color]
    return matched_doors

def find_elevators(room):
    world = room.world
    path = f'.media/smile_exports/{world.slug}/plm_enemies/{room.key}'
    if not os.path.exists(path):
        print(f'skipping elevators because of missing plm_enimies:')
        print(room.get_dev_url())
        return []
    layer = cv2.imread(path)
    gray = cv2.cvtColor(layer, cv2.COLOR_BGRA2GRAY)
    template = cv2.imread('static/sm/icons/templates/elevator-platform.png', cv2.IMREAD_UNCHANGED)
    gray_template = cv2.cvtColor(template, cv2.COLOR_BGRA2GRAY)
    coords = urcv.template.match(gray, gray_template, threshold=0.85)
    return [[round(x1 / 16), round(y1 / 16)] for x1, y1, _, _ in coords]

def populate_room_elevators(room):
    for [x, y] in find_elevators(room):
        room.data['plm_overrides'] = room.data.get('plm_overrides', {})
        room.data['plm_overrides'][f'{x},{y}'] = 'elevator'

def draw_doors(image, doors, world, offset=[0, 0]):
    rotated_fulls = get_door_icons(world, 'full')
    image = urcv.force_alpha(image)

    for x, y, orientation, color in doors:
        dx = dy = 0
        if orientation == 'right':
            dx = -1
        if orientation == 'down':
            dy = -1
        full = rotated_fulls[orientation][color]
        urcv.draw.paste_alpha(image, full, 16*(x+offset[0]+dx), 16*(y+offset[1]+dy))
    return image


def door_is_overridden(room, door):
    for x, y, w, h, _type in room.data.get('cre_overrides', []):
        if door[0] in range(x, x+w) and door[1] in range(y, y+h):
            return True


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
        world_slug = world.slug if layer_name == 'layer-1' else 'super-metroid'

        matched_doors.update(find_doors(layer, world_slug, room.id))
    all_doors = list(matched_doors.values())
    room.data['doors'] = []
    for door in all_doors:
        room_x = door[0] // 16
        room_y = door[1] // 16
        if door_is_overridden(room, door):
            print("door overridden", room.get_dev_url(), door)
            continue
        if [room_x, room_y] not in room.data.get('holes', []):
            room.data['doors'].append(door)
