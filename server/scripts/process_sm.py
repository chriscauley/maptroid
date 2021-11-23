import _setup

import sys


from maptroid.sm import process_zone
from maptroid.models import World

world_id = None
zone_names = []

for arg in sys.argv[1:]:
    if arg.isdigit():
        world_id = int(arg)
    else:
        zone_names.append(arg)


if not world_id:
    worlds = World.objects.all()
    for world in worlds:
        print(world.id, '-', world.name)
    world_id = input("Select a world: ")

world = World.objects.get(id=world_id)
zones = world.zone_set.all()
if zone_names:
    zones = zones.filter(slug__in=zone_names)

print(f'processing {len(zones)} zones')
for zone in zones:
    print('processing', zone.name)
    process_zone(zone)