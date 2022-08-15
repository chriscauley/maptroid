from _setup import get_wzr

import os
import shutil

def main():
    world, zones, rooms = get_wzr()
    root_dir = f'/home/chriscauley/projects/_maptroid-sink/{world.slug}/'
    for room in rooms:
        event = room.data.get('default_event', 'E5E6=STANDARD1')
        for layer in ['plm_enemies', 'layer-1', 'layer-2', 'bts']:
            src = os.path.join(root_dir, layer, event, room.key)
            dest = os.path.join(root_dir, layer, room.key)
            shutil.copyfile(src, dest)
    print(f"now run bash scripts/resync_maptroid.sh {world.slug}")

if __name__ == "__main__":
    main()
