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
    image = image[dy*16:-dh*16,dx*16:-dw*16]
    return image

UNKNOWN = None

for zone in zones:
    if zone.slug.startswith('unknown'):
        UNKNOWN = zone
        if '--reset' in sys.argv:
            rooms = zone.room_set.all()
            print(f'reset room for {rooms.count()} rooms')
            rooms.update(zone=None)
        continue
    _path = WORLD / f'area_{zone.slug}.png'
    if not _path.exists():
        print(f'WARNING: {zone.slug} missing')
        continue
    zone_image = cv2.cvtColor(cv2.imread(str(_path)), cv2.COLOR_BGR2GRAY)
    old_size = zone_image.size
    zone_image = autocrop(zone_image)
    if old_size != zone_image.size:
        cv2.imwrite(str(_path), zone_image)
    zone_images.append([zone, zone_image])

input("Press enter to continue or ctrl+c to halt")

success = 0
fails = 0

for room in world.room_set.filter(zone__isnull=True): # TODO filter zone__isnull when done
    room_path = LAYER_1 / room.key
    if not room_path.exists():
        print('skipping room', room.key)
        continue
    raw_image = cv2.imread(str(room_path))
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
        matches = urcv.template.match(zone_image, gray, scale=1, threshold=0.8)
        if len(matches):
            room.zone = zone
            x, y = matches[0]
            room.data['zone']['bounds'][0] = x // 128
            room.data['zone']['bounds'][1] = y // 128
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