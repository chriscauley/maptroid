# makes power-suit.json from powersuit.png
# adapted from https://stackoverflow.com/questions/13584586/sprite-sheet-detect-individual-sprite-bounds-automatically
# removed OTSU thresh, close, and dilate steps because my sprites are pixelated
# dilation was causing sprites to overlap
import _setup

import cv2
import json
import numpy as np
from django.conf import settings

image = cv2.imread('static/sm/power-suit.png')
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY)[1]

cnts = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
cnts = cnts[0] if len(cnts) == 2 else cnts[1]

result = []
for c in cnts:
    x, y, w, h = cv2.boundingRect(c)
    cv2.rectangle(image, (x, y), (x + w, y + h), (36,255,12), 1)
    result.append([x, y, w, h])

cv2.imwrite('.media/trash/gray_power-suite.png', gray)
cv2.imwrite('.media/trash/thresh_power-suite.png', thresh)
cv2.imwrite('.media/trash/result_power-suite.png', image)
with open('static/sm/power-suit.json', 'w') as f:
    f.write(json.dumps(result))
