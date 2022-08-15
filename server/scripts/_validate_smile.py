from _setup import get_wzr

from collections import defaultdict
import cv2
import json
import os
import sys

from maptroid.utils import get_winderz

def main():
    world, zones, rooms = get_wzr()
    winderz = get_winderz(world.slug)
    root_dir = f'/home/chriscauley/projects/_maptroid-sink/{world.slug}/'
    layer_fails = defaultdict(int)
    layer_dne = defaultdict(int)
    fails = []
    dne = []
    success = 0
    winderz['room_errors'] = {}
    for room in rooms:
        smile_id = room.key.split("_")[-1].split(".")[0]
        x,y,w,h = room.data['zone']['bounds']
        h_px = h * 256
        w_px = w * 256
        for layer in ['plm_enemies', 'layer-1', 'layer-2', 'bts']:
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
                    winderz['room_errors'][smile_id][error_key] = 'bad_shape'
                else:
                    success += 1
    for f in fails:
        if '--rm' in sys.argv:
            os.remove(f)
        else:
            print("kolourpaint ",f)
    print(layer_fails)
    print(layer_dne)
    print(len(dne))
    print(success)
    winderz._save()

if __name__ == "__main__":
    main()
