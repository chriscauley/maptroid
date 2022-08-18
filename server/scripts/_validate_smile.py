from _setup import get_wzr

from collections import defaultdict
import cv2
from django.conf import settings
import json
import os
import sys

from maptroid.utils import get_winderz

ALL_LAYERS = ['plm_enemies', 'layer-1', 'layer-2', 'bts', 'bts-extra']

def main():
    world, zones, rooms = get_wzr()
    winderz = get_winderz(world.slug)
    root_dir = os.path.join(settings.MAPTROID_SINK_PATH, world.slug)
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
        h_px = h * 256
        w_px = w * 256
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
                if ih != h_px or iw != w_px:
                    print('image: ',[iw, ih], '\tzone:',[w_px,h_px])
                    fails.append(image_path)
                    layer_fails[layer] += 1
                    winderz['room_errors'][smile_id] = winderz['room_errors'].get(smile_id, {})
                    if ih % 256 + iw%256 == 0:
                        rms.append(image_path)
                    else:
                        kolourpaints.append(image_path)
                    winderz['room_errors'][smile_id][error_key] = 'bad_shape'
                else:
                    success += 1
    for f in kolourpaints:
        print("kolourpaint ",f)
    for f in rms:
        print("rm ",f)
    print('fails:', layer_fails)
    print('dne:', layer_dne)
    print('dne:', len(dne))
    print('success:', success)
    winderz._save()

if __name__ == "__main__":
    main()
