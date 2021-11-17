import _setup

import datetime
from django.conf import settings
from maptroid.dzi import png_to_dzi
from maptroid.models import Zone
from maptroid.views import process
from PIL import Image
import os
import sys

zone_id = None
for arg in sys.argv:
    if arg.isdigit():
        zone_id = int(arg)

if not zone_id:
    zones = Zone.objects.filter(world=3)
    for zone in zones:
        print(zone.id, '-', zone.name, os.path.exists(zone.get_image_path('dzi')))
    zone_id = input("Select a zone: ")

DIR = '.media/dread_zones/'

class Logger():
    start = None
    last = None
    def __init__(self):
        self.start = self.last = datetime.datetime.now()
    def __call__(self, *args):
        dt = datetime.datetime.now() - self.last
        print(int(1000*dt.total_seconds()),*args)
        self.last = datetime.datetime.now()

log = Logger()

zone = Zone.objects.get(id=zone_id)

log('start')
if '--skip-png' not in sys.argv:
    process(zone, zone.world)
    log('processed ', zone.name)

png = os.path.join(
    settings.MEDIA_ROOT,
    zone.data['output']['png'].split(settings.MEDIA_URL)[-1]
)

if '--skip-dzi' not in sys.argv:
    png_to_dzi(png)
    log('dzi made')

if '--skip-resize' not in sys.argv:
    for factor in [0.5, 0.25, 0.125, 0.0625]:
        SIZE_DIR = f'.media/dread_zones/{factor}x/'
        if not os.path.exists(SIZE_DIR):
            os.mkdir(SIZE_DIR)
        im = Image.open(png)
        outpath = os.path.join(SIZE_DIR, png.split('/')[-1])
        resized_im = im.resize((round(im.size[0]*factor), round(im.size[1]*factor)))
        resized_im.save(outpath)
        log('resized ', factor)
