import _setup
from collections import defaultdict
import cv2
import json
import numpy as np
import os
import subprocess
import urcv

from maptroid.models import SmileSprite

sprites_by_width = defaultdict(list)

samus_eater = cv2.imread('static/sm/icons/samus-eater.png', cv2.IMREAD_UNCHANGED)
ship = cv2.imread('static/sm/icons/ship.png', cv2.IMREAD_UNCHANGED)

sprites_by_width[ship.shape[1]].append(['ship', ship, *ship.shape[:2][::-1]])
sprites_by_width[64].append(['samus-eater', samus_eater, 64, 32])
sprites_by_width[64].append(['samus-eater_flipped', cv2.flip(samus_eater, -1), 64, 32])

for sprite in SmileSprite.objects.filter(template=True):
    img = cv2.imread(str(sprite.image.path), cv2.IMREAD_UNCHANGED)
    h, w = img.shape[:2]
    sprites_by_width[w].append([sprite.type, img, w, h])

results = {}

kernel = cv2.getStructuringElement(cv2.MORPH_CROSS,(3,3))

for width, sprites in sprites_by_width.items():
    heights = []
    results[f'template_{width}'] = []
    for type_, img, width, height in sprites:
        closed = img.copy()
        closed[:,:,:3] = 0
        closed = cv2.morphologyEx(closed, cv2.MORPH_CLOSE, kernel)
        urcv.draw.paste_alpha(closed, img, 0, 0)
        results[f'template_{width}'].append([type_, width, height])
        cv2.imwrite(f'static/sm/icons/templates/{type_}.png', closed)

with open(f'static/sm/icons/template_sprites.json', 'w') as f:
    f.write(json.dumps(results, indent=2))

os.chdir('../client')
subprocess.run(['node', 'repack.js'])