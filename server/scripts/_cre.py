import _setup
import cv2
from django.conf import settings
from imutils.object_detection import non_max_suppression
import numpy as np
from pathlib import Path
import sys

from maptroid.models import Zone
from maptroid.models import Room
from maptroid.icons import get_icons
from maptroid.cre import scan_for_cre
from maptroid.sm import make_walls_image

# make_walls_image(Zone.objects.get(id=19), '.media/testing.png')
threshold = 0.8
icons = get_icons('block', _cvt=cv2.COLOR_BGRA2GRAY)
colors = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [0, 255, 255],
    [255, 0, 255],
    [255, 255, 0],
]
room = Room.objects.get(id=sys.argv[1])
room_layer_1 = Path(settings.MEDIA_ROOT) / f'smile_exports/super-metroid/layer-1/{room.key}'
image = cv2.imread(str(room_layer_1))

clone = image.copy()
room.data['cre'] = {}
scan_for_cre(room)
for name, xys in room.data['cre'].items():
    if xys:
        print(name, len(xys))
# cv2.imwrite('.media/_marked.png', clone)