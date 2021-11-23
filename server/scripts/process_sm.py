import _setup

import sys

from maptroid.sm import process_zone
from maptroid.models import World

world_id = None

for arg in sys.argv:
    if arg.isdigit():
        world_id = int(arg)

if not world_id:
    worlds = World.objects.all()
    for world in worlds:
        print(world.id, '-', world.name)
    world_id = input("Select a world: ")

world = World.objects.get(id=world_id)

for zone in world.zone_set.all():
    print('processing', zone.name)
    process_zone(zone)