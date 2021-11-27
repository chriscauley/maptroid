# creates zone pngs+dzis for a world

from _setup import get_world_zones_from_argv
import sys

from maptroid.sm import process_zone
from maptroid.models import World

world, zones = get_world_zones_from_argv()

print(f'processing {len(zones)} zones')
for zone in zones:
    print('processing', zone.name)
    process_zone(zone)