# Trying to figure out how to find doors in layer-1 and plm
from _setup import get_world_zones_from_argv
import cv2
import numpy as np
import sys

from maptroid.doors import get_door_icons


if __name__ == "__main__":
    _icons = get_door_icons('ypx', 'can')
    for orientation, icons_by_color in _icons.items():
        results = []
        for color, icon in icons_by_color.items():
            results.append(icon)
        cv2.imwrite(f'.media/trash/{orientation}.png', np.hstack(results))