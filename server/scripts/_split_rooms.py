from _setup import get_wzr

import cv2
from collections import defaultdict
import os
import urcv

from maptroid.models import Room

world, zones, rooms = get_wzr()

for room in rooms:
    if not room.data.get('splits', []):
        continue
    print('splitting', room.id, room.key)
    xys_by_color = defaultdict(list)

    for split in room.data.get('splits'):
        x, y, color = split
        xys_by_color[color].append((x,y))

    used_xys = {}
    _, _, w, h = room.data['zone']['bounds']
    old_zone = room.zone
    for color, xys in xys_by_color.items():
        new_key = room.key.replace('.png', f'-{color}.png')
        holes = [(x,y) for x in range(w) for y in range(h) if not (x, y) in xys]
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

            for x, y in holes:
                result[y*256:(y+1) * 256,x*256:(x+1) * 256] = 0

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

        new_room, new = Room.objects.get_or_create(world=world, key=new_key)
        new_room.data['holes'] = holes
        if new:
            print('new_room', new_room)
        new_room.data['zone'] ={
            'bounds': [0,0,w,h],
            'raw': [0,0,w,h],
        }
        if not old_zone.slug.startswith('ztrash-'):
            new_room.zone = old_zone
        new_room.save()
    room.zone = world.zone_set.filter(slug__startswith='ztrash-').first()
    room.save()