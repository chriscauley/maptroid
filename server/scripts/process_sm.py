# creates zone pngs+dzis for a world

from _setup import get_world_zones_from_argv
import sys

from maptroid.sm import process_zone
from maptroid.models import World

world = get_world_from_argv()

print(f'processing {len(zones)} zones')
world.normalize()
zones = world.zone_set.all()
for zone in zones:
    print('processing', zone.name)
    process_zone(zone)