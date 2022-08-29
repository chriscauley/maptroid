import _setup
from django.conf import settings
from shutil import copy
import os
from PIL import Image

from maptroid.models import Screenshot, World

SOURCE = settings.SINK_DIR
DEST = '.media/screenshots/dread'

dest_files = os.listdir(DEST)

world = World.objects.get(name='Metroid Dread')

crop0 = 140
crop1 = 570

for f in os.listdir(SOURCE):
    if not f in dest_files:
        dest_path = os.path.join(DEST, f)
        print('copying', f)
        copy(os.path.join(SOURCE, f), os.path.join(DEST, 'source', f))
        uncropped = Image.open(os.path.join(SOURCE, f))
        uncropped.crop((0, crop0, uncropped.width, crop1)).save(dest_path)
        ss = Screenshot.objects.create(
            world=world,
            src=dest_path.replace('.media/', ''),
        )

