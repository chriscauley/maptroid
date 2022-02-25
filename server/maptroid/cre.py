from collections import defaultdict
import cv2
from django.conf import settings
from imutils.object_detection import non_max_suppression
from maptroid.icons import get_icons
import numpy as np
import os

# These seem to be left out of bts layer and need to be scanned
SCAN_TEMPLATES = [
    'grapple',
    'grapple-a',
    'spike-up',
    'spike-down',
    'spike-left',
    'spike-right',
    'ws-spike-a-up',
    'ws-spike-b-up',
    'kraid-spike-a-up',
    'kraid-spike-b-up',
]

def scan_for_cre(room, templates=SCAN_TEMPLATES):
    threshold = 0.8
    icons = get_icons('block', _cvt=cv2.COLOR_BGRA2GRAY)
    r = 'layer-2' if room.data.get('invert_layers') else 'layer-1'
    room_layer_1 = os.path.join(settings.MEDIA_ROOT, f'smile_exports/super_metroid/{r}/{room.key}')
    image = cv2.imread(room_layer_1)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    results = defaultdict(list)

    for template_name in templates:
        template = icons[template_name]
        result = cv2.matchTemplate(gray, template, cv2.TM_CCOEFF_NORMED)
        (yCoords, xCoords) = np.where(result >= threshold)
        (tH, tW) = template.shape[:2]

        rects = [(x, y, x + tW, y + tH) for (x, y) in zip(xCoords, yCoords)]
        pick = non_max_suppression(np.array(rects))

        results[template_name] = []
        for (x, y, _w, _h) in rects:
            results[template_name].append([round(x/16), round(y/16)])
    room.data['cre'].update(results)
