import _setup
from django.conf import settings
from maptroid.dzi import png_to_dzi
from maptroid.models import Zone
from maptroid.views import process
import os
import sys

DIR = '.media/dread_zones/'
zones = Zone.objects.filter(world=3)

for zone in zones:
    if '--skip-png' not in sys.argv and not zone.data.get('hidden'):
        print('processing ', zone.name)
        process(zone, zone.world)
    print(zone.data)
