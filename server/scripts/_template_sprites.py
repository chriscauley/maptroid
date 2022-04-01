import _setup
from collections import defaultdict
import cv2
import json
import numpy as np
import urcv

from maptroid.models import SmileSprite

sprites_by_width = defaultdict(list)

for s in SmileSprite.objects.filter(template=True):
    img = cv2.imread(str(s.image.path), cv2.IMREAD_UNCHANGED)
    h, w = img.shape[:2]
    sprites_by_width[w].append([s, img, w, h])

results = {}

kernel = cv2.getStructuringElement(cv2.MORPH_CROSS,(3,3))

for width, sprites in sprites_by_width.items():
    heights = []
    icons = []
    for sprite, img, width, height in sprites:
        icons.append(sprite.type)
        heights.append(height)

    results[f'template_{width}'] = {
        'width': width,
        'heights': heights,
        'icons': icons,
    }
    canvas = np.zeros((sum(heights), width, 4), dtype=np.uint8)
    y = 0
    for sprite, img, _, _ in sprites:
        black = img.copy()
        black[:,:,:3] = 0
        black = cv2.morphologyEx(black, cv2.MORPH_CLOSE, kernel)
        urcv.draw.paste(canvas, black, 0, y)
        urcv.draw.paste_alpha(canvas, img, 0, y)
        height += img.shape[0]
    cv2.imwrite(f'static/sm/icons/template_{width}.png', canvas)

with open(f'static/sm/icons/template_sprites.json', 'w') as f:
    f.write(json.dumps(results))