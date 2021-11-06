import _setup

import datetime
from django.conf import settings
from maptroid.dzi import png_to_dzi
from maptroid.models import Zone
from maptroid.views import process
import os
import sys

if len(sys.argv) == 2 and sys.argv[1].isdigit():
    zone_id = sys.argv[1]
if (not len(sys.argv) > 1):
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
log('starting', zone.name)
if '--force' in sys.argv:
    log('processing ', zone.name)
    process(zone, zone.world)
log('making dzi', zone.name)
png = os.path.join(
    settings.MEDIA_ROOT,
    zone.data['output']['png'].split(settings.MEDIA_URL)[-1]
)
png_to_dzi(png)
log('dzi made')