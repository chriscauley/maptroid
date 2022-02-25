from collections import OrderedDict
from django.conf import settings
import json
import numpy as np
from pathlib import Path
import cv2

import urcv

SM_DIR = settings.BASE_DIR / '../static/sm/'

MAP_OPERATIONS = {
    'shot': dict(brightness=40, contrast=20),
    'crumble': dict(brightness=20, contrast=40),
    'bomb': dict(brightness=20, multiply=(2,0.5,0.5,1)),
    'missile': dict(brightness=20, multiply=(1,1,2,1), contrast=20),
    'super-missile': dict(multiply=(0,1,0,1)),
    'power-bomb': dict(brightness=50, multiply=(0,0.5,1,1), contrast=40),
    'speed-booster': dict(brightness=50, multiply=(0, 1.5, 0, 1), contrast=20),
    'grapple': dict(multiply=(1, 1, 0, 1)),
    'spike-up': dict(multiply=(0,0,1,1)),
    'conveyor-up': dict(brightness=150, multiply=(0, 1, 1, 1), contrast=50, alpha=0.75),
    'ws-spike-a-up': dict(multiply=(0,0,1,1)),
    'ws-spike-b-up': dict(multiply=(0,0,1,1)),
}


MAP_OPERATIONS['grapple-break'] = MAP_OPERATIONS['grapple']
for d in ['down', 'left', 'right']:
  MAP_OPERATIONS['spike-'+d] = MAP_OPERATIONS['spike-up']
  MAP_OPERATIONS['conveyor-'+d] = MAP_OPERATIONS['conveyor-up']
  MAP_OPERATIONS['ws-spike-a-'+d] = MAP_OPERATIONS['ws-spike-a-up']
  MAP_OPERATIONS['ws-spike-b-'+d] = MAP_OPERATIONS['ws-spike-b-up']


def apply_brightness_contrast(image, brightness = 0, contrast = 0):
    if brightness == 0 and contrast == 0:
        return image

    if brightness != 0:
        if brightness > 0:
            shadow = brightness
            highlight = 255
        else:
            shadow = 0
            highlight = 255 + brightness
        alpha_b = (highlight - shadow)/255
        gamma_b = shadow

        buf = cv2.addWeighted(image, alpha_b, image, 0, gamma_b)
    else:
        buf = image.copy()

    if contrast != 0:
        f = 131*(contrast + 127)/(127*(131-contrast))
        alpha_c = f
        gamma_c = 127*(1-f)

        buf = cv2.addWeighted(buf, alpha_c, buf, 0, gamma_c)

    return buf


def _process(image, brightness=0, contrast=0, grayscale=0, multiply=None, alpha=1):
    alpha_channel = None
    if image.shape[2] == 4:
        alpha_channel = image[:,:,3]
        image = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
    if grayscale:
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        hsv = cv2.multiply(hsv, (1, 1, grayscale, 1))
        image = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    image = apply_brightness_contrast(image, brightness, contrast)
    if multiply is not None:
        image = cv2.multiply(image, multiply)
    if alpha_channel is not None:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
        image[:,:,3] = alpha * alpha_channel
    return image

def get_icons(category, _cvt=None, operations={}, scale=1):
    cat_map = json.loads((SM_DIR / 'icons.json').read_text())
    icon_map = OrderedDict()
    details = cat_map[category]
    w, h = details['size']
    png = cv2.imread(str(SM_DIR / f'{category}.png'), cv2.IMREAD_UNCHANGED)
    if scale != 1:
        png = urcv.transform.scale(png, scale)
        w = int(w * scale)
        h = int(h * scale)
    if _cvt is not None:
        png = cv2.cvtColor(png, _cvt)
    for i, slug in enumerate(details['icons']):
        icon_map[slug] = urcv.transform.crop(png, [0, i * h, w, h])
        if slug in operations:
            icon_map[slug] = _process(icon_map[slug], **operations[slug])
    return icon_map

def recombine(icon_map):
    w, h, d = list(icon_map.values())[0].shape
    result = np.zeros((h*len(icon_map), w, d), dtype=np.uint8)
    for i, image in enumerate(icon_map.values()):
        result[i*h:(i+1)*h,:,:]= image
    return result