from _setup import get_world_zones_from_argv

import cv2
import hashlib
from imagehash import colorhash, dhash
import os
from PIL import Image
from pathlib import Path
import sys

import unrest_image as img
import urcv

from sprite.models import MatchedSprite, PlmSprite, RoomPlmSprite

world, zones = get_world_zones_from_argv()
PLM_DIR = Path(f'.media/smile_exports/{world.slug}/plm_enemies/')

matches = {}
miss = 0
match = 0

def _hash(value):
    old_seed = os.environ.get('PYTHONHASHSEED')
    os.environ['PYTHONHASHSEED'] = '0'
    result = hash(value)
    if old_seed:
        os.environ['PYTHONHASHSEED'] = old_seed
    else:
        os.environ.pop('PYTHONHASHSEED')
    return result

for zone in zones:
    rooms = zone.room_set.all()
    room = rooms[:5]
    for room in rooms:
        image_path = str(Path(PLM_DIR / room.key))
        if not os.path.exists(image_path):
            continue
        image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
        original = image.copy()
        gray = cv2.bitwise_not(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY))
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3,3))
        close = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
        dilate = cv2.dilate(close, kernel, iterations=2)

        cnts = cv2.findContours(dilate, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cnts = cnts[0] if len(cnts) == 2 else cnts[1]

        sprite_number = 0
        def save(name, image):
            filepath = f'.media/trash/{name}__{room.key}'
            cv2.imwrite(filepath, image)

        for c in cnts:
            x, y, w, h = cv2.boundingRect(c)
            cropped = urcv.transform.autocrop_zeros(image[y:y+h, x:x+w])
            sprite_number += 1
            new, plmsprite = PlmSprite.get_or_create_from_np_array(cropped)
            RoomPlmSprite.objects.get_or_create(room=room, plmsprite=plmsprite, xy=[x, y])

            if plmsprite.datahash in matches:
                match += 1
            else:
                matches[plmsprite.datahash] = True
                miss += 1

print(miss, match, len(matches))

