import cv2
import functools
import numpy as np
import urcv

from maptroid.icons import get_icons, SM_DIR

@functools.lru_cache
def get_cap_icons():
    return {
        'left': get_icons('door_caps'),
        'right': get_icons('door_caps', operations={"*": {"rotate": 180 }}),
        'up': get_icons('door_caps', operations={"*": {"rotate": 90 }}),
        'down': get_icons('door_caps', operations={"*": {"rotate": 270 }}),
    }

@functools.lru_cache
def get_can_icons():
    left = cv2.imread(str(SM_DIR / 'door_can.png'), cv2.IMREAD_UNCHANGED)
    return {
        'left': [left, 0, 0],
        'right': [cv2.rotate(left, cv2.ROTATE_180), -1, 0],
        'up': [cv2.rotate(left, cv2.ROTATE_90_CLOCKWISE), 0, 0],
        'down': [cv2.rotate(left, cv2.ROTATE_90_COUNTERCLOCKWISE), 0, -1],
    }

@functools.lru_cache
def get_halfcan_icons():
    can_icons = get_can_icons()
    out = {}
    for orientation, value in can_icons.items():
        icon = value[0].copy()
        if orientation == 'right':
            icon = icon[:,16:]
        elif orientation == 'left':
            icon = icon[:,:16]
        elif orientation == 'down':
            icon = icon[16:]
        else:
            icon = icon[:16]
        out[orientation] = [icon, 0, 0]
    return out

@functools.lru_cache
def get_door_colors():
    cap_icons = get_cap_icons()
    color_map = {}
    for color, icon in cap_icons['left'].items():
        color_map[color.replace('cap_', '')] = urcv.top_color(icon)
    return color_map

@functools.lru_cache
def get_gray_door_icons():
    return {
        **get_icons('doors_right-left', _cvt=cv2.COLOR_BGRA2GRAY),
        **get_icons('doors_up-down', _cvt=cv2.COLOR_BGRA2GRAY),
    }

def match_door_color(image):
    door_colors = get_door_colors()
    top_color = urcv.top_color(image, exclude=((0,0,0),(21,21,21)))
    max_distance = 255*3
    match = None
    for name, color in door_colors.items():
        distance = sum([abs(int(c1)-int(c2)) for c1, c2 in zip(top_color, color)])
        if distance < max_distance:
            max_distance = distance
            match = name
    return match

def find_doors(image):
    gray_icons = get_gray_door_icons()
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
            color = match_door_color(door)

            matched_doors[(x, y)] = [int(x/16), int(y/16), orientation, color]
    return matched_doors

def draw_doors(image, doors, offset=[0, 0], cans=None):
    rotated_caps = get_cap_icons()
    image = urcv.force_alpha(image)

    for x, y, orientation, color in doors:
        cap = rotated_caps[orientation]['cap_'+color]
        urcv.draw.paste_alpha(image, cap, 16*(x+offset[0]), 16*(y+offset[1]))
        if cans is not None:
            can, dx, dy = cans[orientation]
            urcv.draw.paste_alpha(
                image,
                can,
                16*(x+offset[0]+dx),
                16*(y+offset[1]+dy)
            )
    return image

def populate_room_doors(room):
    world = room.world.slug
    matched_doors = {}
    for layer_name in ['layer-1', 'plm_enemies']:
        layer = cv2.imread(f'.media/smile_exports/{world}/{layer_name}/{room.key}')
        if layer is None:
            print(f'skipping {layer_name} for {room.key}')
            continue
        matched_doors.update(find_doors(layer))

    room.data['doors'] = list(matched_doors.values())