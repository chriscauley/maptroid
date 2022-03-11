# creates zone pngs+dzis for a world

from _setup import get_world_zones_from_argv
import sys

from maptroid.doors import populate_room_doors
from maptroid.models import World
from maptroid.sm import process_zone

world, zones = get_world_zones_from_argv()

world.normalize()
print(f'processing {len(zones)} zones')
for zone in zones:
    print('processing', zone.name)
    for room in zone.room_set.all():
        if 'doors' not in room.data or '--doors' in sys.argv:
            if 'doors' not in room.data:
                print(f'redoing doors for room #{room.id} - {room.key}')
            populate_room_doors(room)
            room.save()
    process_zone(zone)