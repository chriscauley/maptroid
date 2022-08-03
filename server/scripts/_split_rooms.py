from _setup import get_wzr

import cv2
from collections import defaultdict
import os
import sys
import urcv

from maptroid.models import Room

world, zones, rooms = get_wzr()

def crop(image, coords):
    x, y, w, h = [i*256 for i in coords]
    return image[y:y+h,x:x+w]

for room in rooms:
    if not room.data.get('splits', []):
        continue
    print('splitting', room.id, room.key)
    xys_by_color = defaultdict(list)

    for split in room.data.get('splits'):
        x, y, color = split
        xys_by_color[color].append((x,y))

    used_xys = {}
    zx, zy, zw, zh = room.data['zone']['bounds']
    old_zone = room.zone
    for color, xys in xys_by_color.items():
        x_max = max([xy[0] for xy in xys])
        y_max = max([xy[1] for xy in xys])
        x_min = min([xy[0] for xy in xys])
        y_min = min([xy[1] for xy in xys])
        room_w = x_max - x_min + 1
        room_h = y_max - y_min + 1

        new_key = room.key.replace('.png', f'-{color}.png')
        new_room, new = Room.objects.get_or_create(world=world, key=new_key)
        if new_room.data.get('split_lock'):
            print(f'Skipping room due to split_lock {new_room.key}')
            continue

        zone_holes = [(x,y) for x in range(zw) for y in range(zh) if not (x, y) in xys]
        for xy in xys:
            if xy in used_xys:
                raise ValueError(f"Duplicate xy {xy} in room {room}")

        layer_1 = None
        for layer in ['bts', 'layer-1', 'layer-2', 'plm_enemies']:
            source = f'.media/smile_exports/{world.slug}/{layer}/{room.key}'
            if not os.path.exists(source):
                print(f'skipping {layer} because image is missing for {room}')
                continue
            source = cv2.imread(source, cv2.IMREAD_UNCHANGED)
            if len(source.shape) == 2:
                source = cv2.cvtColor(source, cv2.COLOR_GRAY2BGR)
            if source.shape[2] == 3:
                source = cv2.cvtColor(source, cv2.COLOR_BGR2BGRA)
            result = source.copy()

            for x, y in zone_holes:
                result[y*256:(y+1) * 256,x*256:(x+1) * 256] = 0

            # trim to room dimensions
            result = crop(result, (x_min, y_min, room_w, room_h))

            dest = f'.media/smile_exports/{world.slug}/{layer}/{new_key}'
            cv2.imwrite(dest, result)
            dest = f'.media/sm_cache/{world.slug}/{layer}/{new_key}'
            cv2.imwrite(dest, result)

            if layer == 'layer-1':
                layer_1 = result
            if layer == 'layer-2':
                # combine layer-1 and layer-2 images to avoid needing to run script #2
                dest = f'.media/sm_cache/{world.slug}/layer-2+layer-1/{new_key}'
                urcv.draw.paste_alpha(result, layer_1, 0, 0)
                cv2.imwrite(dest, result)

        new_xys = [(x-x_min, y-y_min) for x, y in xys]
        new_holes = [(x,y) for x in range(room_w) for y in range(room_h) if not (x, y) in new_xys]
        new_room.data['holes'] = new_holes
        new_room.data['zone'] = {
            'bounds': [zx + x_min, zy + y_min, room_w, room_h],
            'raw': [zx + x_min, zy + y_min, room_w, room_h],
        }
        new_room.data['split_lock'] = True
        if not old_zone.slug.startswith('ztrash-'):
            new_room.zone = old_zone
        new_room.save()
    room.zone = world.zone_set.filter(slug__startswith='ztrash-').first()
    room.save()
