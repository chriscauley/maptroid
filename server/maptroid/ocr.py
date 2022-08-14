# takes screenshots from ./media/smile_exports/WORLD/plm_enemies/batchNUMBER/
# crops, parses room_key/event_name, and assigns to room with best guess of position
from django.conf import settings
from django.core.files.base import ContentFile
import json
import cv2
import numpy as np
import os
from unrest.utils import JsonCache
from maptroid.sm import to_media_url
import random
import urcv


hash_to_letter = JsonCache(os.path.join(settings.BASE_DIR, '../sprite/hash_to_letter.json'))

class UnknownLettersError(Exception):
    pass

class EmptyTextError(Exception):
    pass

def read_text(og_image):
    image = cv2.cvtColor(og_image.copy(), cv2.COLOR_BGR2GRAY)
    image[image == 255] = 0
    image = cv2.threshold(image, 10, 255, cv2.THRESH_BINARY_INV)[1]
    height, width = image.shape
    hashes = []
    current = []
    last = 0
    for x in range(width):
        col = int(np.sum(image[:,x]) // 255)
        if col:
            if not last:
                current = []
                hashes.append(current)
            current.append(str(col))
        last = col

    hashes = [','.join(h) for h in hashes]
    matched_letters = ' '.join([hash_to_letter.get(h, '?') for h in hashes])
    if not len(hashes):
        raise EmptyTextError('Hashes list is empty')
    if '?' in matched_letters:
        # TODO need so save image and add url to dictionary
        path = f'.media/missing_hashes/{random.randint(0,1e6)}.png'
        print('saving new ocr image', path)
        cv2.imwrite(path, image)
        url = path.replace('.media/', '/media/')
        hash_to_letter['__missing'].append([url, hashes])
        hash_to_letter._save()
        raise UnknownLettersError('Unknown letters in ocr, visit site to update dictionary')
    return matched_letters.replace(' ','')
