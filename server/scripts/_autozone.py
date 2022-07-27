from _setup import get_world_zones_from_argv
import cv2
from pathlib import Path
import numpy as np
import sys
import urcv


world, zones = get_world_zones_from_argv()
WORLD = Path(f'.media/smile_exports/{world.slug}')
LAYER_1 = WORLD / 'layer-1'

zone_images = []

def autocrop(image):
    dx = 0
    dy = 0
    dw = 0
    dh = 0
    while np.sum(zone_image[-(dh+1)*16:]) == 0:
        dh += 1
    while np.sum(zone_image[:,-(dw+1)*16:]) == 0:
        dw += 1
    while np.sum(zone_image[:(dy+1)*16]) == 0:
        dy += 1
    while np.sum(zone_image[:,:(dx+1)*16]) == 0:
        dx += 1
    last_x = -dw*16 if dw else None
    last_y = -dh*16 if dh else None
    image = image[dy*16:last_y,dx*16:last_x]
    return image

UNKNOWN = None

zone_xys = {}

for zone in zones:
    if zone.slug.startswith('unknown'):
        UNKNOWN = zone
        if '--reset' in sys.argv:
            rooms = zone.room_set.all()
            print(f'reset room for {rooms.count()} rooms')
            rooms.update(zone=None)
        continue
    _path = WORLD / f'area_{zone.slug}.png'
    if zone.slug.startswith('ztrash'):
        continue
    if not _path.exists():
        print(f'WARNING: {zone.slug} missing')
        continue
    zone_image = cv2.cvtColor(cv2.imread(str(_path)), cv2.COLOR_BGR2GRAY)
    old_size = zone_image.size
    zone_image = autocrop(zone_image)
    print(_path, old_size, zone_image.shape)
    zone_xys[zone.slug] = {}
    zone_images.append([zone, zone_image])

input("Press enter to continue or ctrl+c to halt")

success = 0
fails = 0

for room in world.room_set.filter(zone__isnull=True): # TODO filter zone__isnull when done
    room.zone = None
    room_path = LAYER_1 / room.key
    if not room_path.exists():
        print('skipping room', room.key)
        continue
    raw_image = cv2.imread(str(room_path))
    if np.sum(raw_image) == 0:
        # some rooms are empty and this causes the match template function to eat up all the ram
        room.zone = UNKNOWN
        room.save()
        continue
    scaled = urcv.transform.scale(raw_image, 0.5, interpolation= cv2.INTER_LINEAR)
    gray = cv2.cvtColor(scaled, cv2.COLOR_BGR2GRAY)
    inverted = np.invert(gray)
    inverted = urcv.force_alpha(cv2.cvtColor(inverted, cv2.COLOR_GRAY2BGR))
    inverted[:,:,3] = 128
    for zone, zone_image in zone_images:
        gh, gw = gray.shape
        zh, zw = zone_image.shape
        if zh < gh or zw < gw:
            continue
        matches = urcv.template.match(zone_image, gray, threshold=0.85)
        if len(matches) > 10:
            new_matches = urcv.template.match(zone_image, gray, threshold=0.9)
            if len(new_matches):
                print('downmatching', room.key)
                matches = new_matches
        if len(matches) > 1:
            copy = zone_image.copy()
            urcv.draw.paste(copy, gray, 0, 0)
            copy = cv2.cvtColor(copy, cv2.COLOR_GRAY2BGR)
            for x, y, x2, y2 in matches:
                cv2.rectangle(copy, (x, y), (x2, y2), (0,0,255), 3)
            cv2.imwrite(f'.media/trash/overmatched__{room.key}', copy)
        for match in matches:
            x, y, x2, y2 = match
            x = round(x / 128)
            y = round(y / 128)
            if (x, y) in zone_xys[zone.slug]:
                continue # already used
            zone_xys[zone.slug][(x, y)] = True
            room.zone = zone
            room.data['zone']['bounds'][0] = x
            room.data['zone']['bounds'][1] = y
            room.data['zone']['raw'] = room.data['zone']['bounds']
            success += 1
            print('yay!', zone.slug, room.key, room.data['zone']['bounds'], len(matches))
            room.save()
            break
    if not room.zone:
        fails += 1
        room.zone = UNKNOWN
        room.save()
        print('no match', room.key)


print(f"{success} matched\n{fails} failed")
