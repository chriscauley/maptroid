from _setup import get_wzr

from collections import defaultdict
import cv2
from django.conf import settings
import json
import numpy as np
import os
import sys
import urcv

from maptroid.utils import get_winderz

ALL_LAYERS = ['plm_enemies', 'layer-1', 'layer-2', 'bts', 'bts-extra']
BG_COLOR = (255, 128, 128)
KERNEL = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))

def check_bg_color(image):
    # Unfortunately this adds like 30 seconds to total execution time.
    contains_bg_color = np.any(np.all(image == BG_COLOR, axis=-1))
    return not contains_bg_color

def main():
    world, zones, rooms = get_wzr()
    winderz = get_winderz(world.slug)
    root_dir = os.path.join(settings.SINK_DIR, world.slug)
    layer_fails = defaultdict(int)
    layer_dne = defaultdict(int)
    fails = []
    dne = []
    success = 0
    winderz['room_errors'] = {}
    layers = []
    kolourpaints = []
    rms = []
    for layer in ALL_LAYERS:
        if not os.path.exists(f'{root_dir}/{layer}/'):
            print("WARNING: no layer", layer)
        else:
            layers.append(layer)
    for room in rooms:
        smile_id = room.key.split("_")[-1].split(".")[0]
        x,y,w,h = room.data['zone']['bounds']
        h_zone = h * 256
        w_zone = w * 256
        if not smile_id in winderz['room_events']:
            print("missing room_events for", smile_id)
            layer_dne['all'] += 1
            continue
        for layer in layers:
            for event in winderz['room_events'][smile_id]:
                image_path = f'{root_dir}/{layer}/{event}/{room.key}'
                error_key = f'{layer}__{event}'
                if not os.path.exists(image_path):
                    dne.append(image_path)
                    layer_dne[layer] += 1
                    print('dne:', layer, room.key, event)
                    winderz['room_errors'][smile_id] = winderz['room_errors'].get(smile_id, {})
                    winderz['room_errors'][smile_id][error_key] = 'dne'
                    continue
                image = cv2.imread(image_path)
                ih, iw = image.shape[:2]

                if ih != h_zone or iw != w_zone:
                    print('image: ',[iw, ih], '\tzone:',[w_zone,h_zone])
                    fails.append(image_path)
                    layer_fails[layer] += 1
                    winderz['room_errors'][smile_id] = winderz['room_errors'].get(smile_id, {})
                    if ih % 256 + iw%256 == 0:
                        rms.append(image_path)
                    elif ih < h_zone or iw < w_zone:
                        rms.append(image_path)
                    else:
                        kolourpaints.append(image_path)
                    winderz['room_errors'][smile_id][error_key] = 'bad_shape'
                elif '--skip-bg-color' not in sys.argv and not check_bg_color(image):
                    fails.append(image_path)
                    kolourpaints.append(image_path)
                    layer_fails[layer] += 1
                    winderz['room_errors'][smile_id] = winderz['room_errors'].get(smile_id, {})
                    winderz['room_errors'][smile_id][error_key] = 'contains_bg'
                else:
                    success += 1
    for f in kolourpaints:
        print("  kolourpaint ",f)
    for f in rms:
        print("  rm ",f)
    print('fails:', layer_fails)
    print('dne:', layer_dne)
    print('dne:', len(dne))
    print('success:', success)
    winderz._save()

if __name__ == "__main__":
    if '--skip-bg-color' not in sys.argv:
        print("Running color check. Use --skip-bg-color to speed up script")
    main()
