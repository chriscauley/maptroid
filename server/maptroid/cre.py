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
    'spike',
]

def scan_for_cre(room, _classes=SCAN_TEMPLATES, layer=None):
    # threshold = 0.8 places kraid spikes on doors
    # threshold = 0.9 misses some of the brinstar spikes
    threshold = 0.85
    icons = {
        **get_icons('block', _cvt=cv2.COLOR_BGRA2GRAY),
        **get_icons('misc-spikes', _cvt=cv2.COLOR_BGRA2GRAY),
    }
    if not layer:
        layer = 'layer-2' if room.data.get('invert_layers') else 'layer-1'
    room_layer_1 = os.path.join(
        settings.MEDIA_ROOT,
        f'smile_exports/{room.world.slug}/{layer}/{room.key}',
    )
    image = cv2.imread(room_layer_1)
    for x, y in room.data.get('holes', []):
        image[y*256:(y+1)*256, x*256:(x+1)*256, :] = 0
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    results = defaultdict(list)
    count = 0

    for template_name in icons.keys():
        _class = template_name.split('_')[0]
        if _class not in _classes:
            continue
        template = icons[template_name]
        result = cv2.matchTemplate(gray, template, cv2.TM_CCOEFF_NORMED)
        (yCoords, xCoords) = np.where(result >= threshold)
        (tH, tW) = template.shape[:2]

        rects = [(x, y, x + tW, y + tH) for (x, y) in zip(xCoords, yCoords)]
        pick = non_max_suppression(np.array(rects))

        results[template_name] = []
        for (x, y, _w, _h) in rects:
            results[template_name].append([round(x/16), round(y/16)])
            count += 1
    if layer == 'layer-2' and count == 0:
        # red brinstar fireflee room has it's spikes in layer-1 even though it's inverted
        results2 = scan_for_cre(room, _classes=_classes, layer='layer-1')
        for key, value in results2.items():
            results[key] = results.get(key, []) + value
    return results

