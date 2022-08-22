# Moves files from event folders into main layer folders

from _setup import get_wzr

import cv2
from django.conf import settings
import numpy as np
import os

from maptroid.utils import colorhash


def remove_cursor(image):
    # there's a white cursor in the top right corner of most images
    # this detects it by finding a vertical white line in one of two places
    # and replaces it with the tile to the right or below it
    if np.all(image[0:14,14:15,:3] == (255,255,255)) or np.all(image[0:14,15:16,:3] == (255,255,255)):
        target_core = image[2:13,2:13]
        right_core = image[2:13,18:29]
        down_core = image[18:29,2:13]
        target_colorhash = colorhash(target_core)
        right_colorhash = colorhash(right_core)
        down_colorhash = colorhash(down_core)
        if abs(target_colorhash - right_colorhash) > abs(target_colorhash - down_colorhash):
            image[0:16,0:16] = image[16:32,0:16]
        else:
            image[0:16,0:16] = image[0:16,16:32]

def main():
    world, zones, rooms = get_wzr()
    root_dir = os.path.join(settings.MAPTROID_SINK_PATH, world.slug)
    for room in rooms:
        event = room.data.get('default_event', 'E5E6=STANDARD1')
        for layer in ['plm_enemies', 'layer-1', 'layer-2', 'bts', 'bts-extra']:
            dest_dir = os.path.join(root_dir, layer)
            if not os.path.exists(dest_dir):
                os.mkdir(dest_dir)
                print("Made directory", dest_dir)
            src = os.path.join(root_dir, layer, event, room.key)
            dest = os.path.join(dest_dir, room.key)
            image = cv2.imread(src, cv2.IMREAD_UNCHANGED)
            remove_cursor(image)
            cv2.imwrite(dest, image)
    print(f"now run bash scripts/resync_maptroid_sink.sh {world.slug}")

if __name__ == "__main__":
    main()
