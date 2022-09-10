# This script processes the high res images of vitality so that they can be consumed by maptroid/sm
# Buffers are added and ZONE.png is resaved as zone.png

import _setup

import cv2
import numpy as np
from django.conf import settings
import os
import urcv

from maptroid.models import World

world = World.objects.get(slug='vitality')

replace = [
    ['Khlys', 'Akhlys'],
    ['Chornobog', 'Tchornobog'],
    ['Pendula moda', 'Pendulu moda'],
]

for old,new in replace:
    zone = world.zone_set.filter(name=old).first()
    if zone:
        zone.name = new
        zone.slug = new.lower().replace(' ', '-')
        zone.save()
        print('updated zone:', zone)

kernel = np.ones((5, 5), np.uint8)
SOURCE_DIR = os.path.join(settings.SINK_DIR, '_hires-vitality')

for s in ['out', 'train', 'left']:
    slug = f'elseq__{s}'
    if not world.zone_set.filter(slug=slug):
        z = world.zone_set.create(
            slug=slug,
            name=f'Elseq ({s})',
        )
        print(z, 'created')

buffers = {
    'akhlys': [32, 0],
    'pendulu-moda': [16+128, 0],
    'andavald': [32, 256],
    'elseq': [32, 0],
    'elseq__left': [32, 0],
    'elseq__out': [32, 0],
    'elseq__train': [32, 0],
    'tac-lacora': [32, 0],
    'tchornobog': [32, 1],
}


for zone in world.zone_set.all():
    if zone.data.get('hidden'):
        continue
    zone.normalize()
    zone.save()
    zone_upper = zone.slug.upper().replace('-', '_')
    path = os.path.join(SOURCE_DIR, zone_upper+'.png')
    img = cv2.imread(path)
    mask = cv2.inRange(img, (127,127,127), (128,128,128))
    outline = cv2.bitwise_and(img, img, mask=mask)
    no_outline = cv2.subtract(img, outline)

    # This was previously used to verify there are no non-outline gray pixels
    # cv2.imwrite(f'.media/trash/outline_{zone.slug}.png', cv2.dilate(outline, kernel))
    # cv2.imwrite(f'.media/trash/no-outline_{zone.slug}.png', no_outline)

    cropped = urcv.transform.autocrop_zeros(no_outline) # takes 21 pixels off each side

    zone_w = zone.data['world']['bounds'][2] * 256
    zone_h = zone.data['world']['bounds'][3] * 256

    top, left = buffers[zone.slug]

    # every image needs a top and bottom buffer of at 13px + however many screens
    _buffer = np.zeros((top, cropped.shape[1], 3), dtype=np.uint8)
    cropped = np.vstack([_buffer, cropped])

    _buffer = np.zeros((cropped.shape[0], left, 3), dtype=np.uint8)
    cropped = np.hstack([_buffer, cropped])

    x_gap = zone_w - cropped.shape[1]
    if x_gap < 0:
        print('zone image might be too wide for ', zone)
    else:
        _buffer = np.zeros((cropped.shape[0], x_gap, 3), dtype=np.uint8)
        cropped = np.hstack([cropped, _buffer])

    y_gap = zone_h - cropped.shape[0]
    if y_gap < 0:
        print('zone image might be too tall for ', zone)
    else:
        _buffer = np.zeros((y_gap, cropped.shape[1], 3), dtype=np.uint8)
        cropped = np.vstack([cropped, _buffer])


    keep = {}
    for x in range(zone.data['world']['bounds'][2]+1):
        for y in range(zone.data['world']['bounds'][3]+1):
            keep[(x, y)] = False

    for room in zone.room_set.all():
        x0, y0, w, h = room.data['zone']['bounds']
        # print(x0, y0, room.data.get('holes'))
        for rx in range(w):
            for ry in range(h):
                # zone x and y is rooms offset plus x relative to room (x0 + rx
                zx = x0 + rx
                zy = y0 + ry
                if not [rx, ry] in room.data.get('holes', []):
                    # print(zx, zy)
                    keep[(zx, zy)] = True

    if zone.slug == 'tchornobog':
        # This room is "behind" the tree, and is offset on the maptroid view
        # Using the lower res scraped image, since it was missing in the hi res scans
        room = zone.room_set.get(key='vitality_7A011.png')
        rx, ry, _, _ = room.data['zone']['bounds']
        urcv.draw.paste(
            cropped,
            cv2.imread(os.path.join(settings.SINK_DIR, 'vitality/layer-1/vitality_7A011.png')),
            rx*256,
            ry*256,
        )

    with_alpha = np.zeros((cropped.shape[0],cropped.shape[1], 4), dtype=np.uint8)
    with_alpha[:,:,:3] = cropped
    with_alpha[:,:,3] = 255
    for (x, y), value in keep.items():
        if not value:
            with_alpha[y*256:(y+1)*256,x*256:(x+1)*256] = 0

    cv2.imwrite(SOURCE_DIR + f'/processed/{zone.slug}.png', with_alpha)

