from collections import OrderedDict
import json
import numpy as np
from pathlib import Path
import cv2

import urcv

SM_DIR = Path(__file__).parent / '../static/sm/'

MAP_OPERATIONS = {
    'shot': dict(brightness=50, contrast=20),
    'crumble': dict(brightness=30, contrast=50),
    'bomb': dict(brightness=20, multiply=(2,0.5,0.5,1)),
    'missile': dict(brightness=20, multiply=(1,1,2,1), contrast=20),
    'super-missile': dict(multiply=(0.5,2,0.5,1)),
    'power-bomb': dict(brightness=50, multiply=(0,1,1.5,1), contrast=40),
    'speed-booster': dict(brightness=50, multiply=(1.5, 0, 1.5, 1), contrast=20),
    'grapple': dict(multiply=(1, 1, 0, 1)),
    'spike': dict(multiply=(0,0,1,1)),
    'conveyor': dict(brightness=150, multiply=(0, 1, 1, 1), contrast=50, alpha=0.75),
}


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


ROTATIONS = {
    90: cv2.ROTATE_90_CLOCKWISE,
    180: cv2.ROTATE_180,
    270: cv2.ROTATE_90_COUNTERCLOCKWISE,
    -90: cv2.ROTATE_90_COUNTERCLOCKWISE,
}


def _process(image, brightness=0, contrast=0, grayscale=0, multiply=None, alpha=1, rotate=None):
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
    if rotate:
        image = cv2.rotate(image, ROTATIONS[rotate])
    return image

def get_template_icons():
    cat_map = json.loads((SM_DIR / 'icons/template_sprites.json').read_text())
    results = {}
    for sprite_list in cat_map.values():
        for key, _width, _height in sprite_list:
            path = str(SM_DIR / f'icons/templates/{key}.png')
            results[key] = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    return results

def get_icons(category, _cvt=None, operations={}, scale=1, source=None):
    source = source or f'{category}.png'
    cat_map = json.loads((SM_DIR / 'icons.json').read_text())
    icon_map = OrderedDict()
    details = cat_map[category]
    w, h = details['size']
    png = cv2.imread(str(SM_DIR / source), cv2.IMREAD_UNCHANGED)
    if scale != 1:
        png = urcv.transform.scale(png, scale)
        w = int(w * scale)
        h = int(h * scale)
    if _cvt is not None:
        png = cv2.cvtColor(png, _cvt)
    for i, slug in enumerate(details['icons']):
        _class = slug.split("_")[0]
        icon_map[slug] = urcv.transform.crop(png, [0, i * h, w, h])
        if _class in operations:
            icon_map[slug] = _process(icon_map[slug], **operations[_class])
        if "*" in operations:
            icon_map[slug] = _process(icon_map[slug], **operations["*"])
    return icon_map

def recombine(icon_map):
    w, h, d = list(icon_map.values())[0].shape
    result = np.zeros((h*len(icon_map), w, d), dtype=np.uint8)
    for i, image in enumerate(icon_map.values()):
        result[i*h:(i+1)*h,:,:]= image
    return result