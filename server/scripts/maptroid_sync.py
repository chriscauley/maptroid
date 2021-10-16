import _setup
from shutil import copy
import os

from maptroid.models import Screenshot, World

SOURCE = '../../_maptroid-sink/dread'
DEST = '.media/screenshots/dread'

dest_files = os.listdir(DEST)

world = World.objects.get(name='Metroid Dread')
print(world)
for f in os.listdir(SOURCE):
    if not f in dest_files:
        dest_path = os.path.join(DEST, f)
        print('copying', f)
        copy(os.path.join(SOURCE, f), dest_path)
        ss = Screenshot.objects.create(
            world=world,
            image=dest_path.replace('.media/', ''),
        )
        print(ss)