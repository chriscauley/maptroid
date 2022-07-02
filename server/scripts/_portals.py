# recolor all the portals using portal/white.png
import cv2
import numpy as np
import json

with open('./static/sm/portal/colors.json') as f:
    colors = json.loads(f.read())

portal = cv2.imread('./static/sm/portal/portal.png', cv2.IMREAD_UNCHANGED)
# portal = cv2.resize(portal, (128, 128))

for name, color in colors.items():
    r = int(color[1:3], 16)
    g = int(color[3:5], 16)
    b = int(color[5:7], 16)
    result = portal.copy()
    result[:,:,:3] = [b,g,r]
    cv2.imwrite(f"./static/sm/portal/{name}.png", result)
    print(f"static/sm/portal/{name}.png")
