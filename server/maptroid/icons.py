from django.conf import settings
import json
from pathlib import Path
import cv2

import urcv

SM_DIR = settings.BASE_DIR / '../static/sm/'

def get_icons(_cvt=None):
    cat_map = json.loads((SM_DIR / 'icons.json').read_text())
    icon_map = {}
    for category, details in cat_map.items():
        w, h = details['size']
        icon_map[category] = {}
        png = cv2.imread(str(SM_DIR / f'{category}.png'), cv2.IMREAD_UNCHANGED)
        if _cvt is not None:
            png = cv2.cvtColor(png, _cvt)
        for i, slug in enumerate(details['icons']):
            icon_map[category][slug] = urcv.transform.crop(png, [0, i * h, w, h])
    return icon_map
