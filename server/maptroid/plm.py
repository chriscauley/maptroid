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

def extract_plmsprites_from_room(room):
    PLM_DIR = Path(f'.media/smile_exports/{world.slug}/plm_enemies/')
    image_path = str(Path(PLM_DIR / room.key))
    if not os.path.exists(image_path):
        return []
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

    hashes = []
    for c in cnts:
        x, y, w, h = cv2.boundingRect(c)
        cropped = urcv.transform.autocrop_zeros(image[y:y+h, x:x+w])
        sprite_number += 1
        new, plmsprite = PlmSprite.get_or_create_from_np_array(cropped)
        RoomPlmSprite.objects.get_or_create(room=room, plmsprite=plmsprite, xy=[x, y])
        if new:
            print('new plmsprite', plmsprite.image.url)
            arst

        hashes.append(plmsprite.datahash)
    return hashes

def media_url_to_path(url):
  return os.path.join(settings.MEDIA_ROOT, url.split(settings.MEDIA_URL)[-1])

def finalize_plm(room):
    OUTPUT_DIR = mkdir(settings.MEDIA_ROOT,f'smile_exports/{world.slug}/plm_enemies/')
    smile_id = room.key.split("_")[-1].split('.')[0]
    if not 'plm_enemies' in room.data:
        print('missing plm_enemies:', room.id)
        return
    plms = [plm for plm in room.data['plm_enemies'] if not plm.get('deleted')]
    if len(plms) != len(set([str(p['xy']) for p in plms])):
        fails += 1
        print('FAIL: room has confusing plms:', room.name)
        return
    if not len(plms):
        fails += 1
        print('FAIL: room has confusing plms:', room.name)
        return

    # make an empty canvas of the right size
    path = os.path.join(settings.MEDIA_ROOT, f'sm_cache/{world.slug}/layer-1/{room.key}')
    if not os.path.exists(path):
        print("WARNING unable to find layer-1 for", room.key)
        return
    sprite_canvas = img._coerce(path, 'np')
    sprite_canvas[:,:,:] = 0

    room.data['plm_sprites'] = []
    for plm in plms:
        cropped_path = media_url_to_path(os.path.join(plm['root_url'], plm['cropped']))
        cropped_data = img._coerce(cropped_path, 'np')
        x, y = plm['xy'] or [0, 0]
        height, width, _ = cropped_data.shape
        sprite_canvas[y:y+height, x:x+width] = cropped_data
    img.make_holes(sprite_canvas, room.data['holes'])
    cv2.imwrite(os.path.join(OUTPUT_DIR, room.key), sprite_canvas)
