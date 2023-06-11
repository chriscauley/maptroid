from _setup import get_wzr

import cv2
from django.conf import settings
import numpy as np
import os
import urcv

world, _, rooms = get_wzr()
SOURCE_DIR = os.path.join(settings.MEDIA_ROOT, f'_maptroid-sink/{world.slug}/plm_enemies')
gate = cv2.imread('static/sm/gatehead.png', cv2.IMREAD_UNCHANGED)
files_to_fix = []

for room in rooms:
    img_path = os.path.join(SOURCE_DIR, room.key)
    if not os.path.exists(img_path):
        continue
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if len(img.shape) == 2:
        continue
    matches = urcv.template.match(img, gate)
    if len(matches) != 0:
        layer_1 = img_path.replace('plm_enemies', 'layer-1')
        print(f"kolourpaint {img_path} {layer_1}")

for m in matches:
    print(m)
print()