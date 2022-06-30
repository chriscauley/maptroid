# creates zone pngs+dzis for a world

from _setup import get_wzr
import sys

from maptroid.doors import populate_room_doors, populate_room_elevators
from maptroid.models import World
from maptroid.sm import process_zone

world, zones, rooms = get_wzr()

world.normalize()
print(f'processing {len(zones)} zones')
for zone in zones:
    print('processing zone: ', zone)
    if zone.name.startswith('ztrash-'):
        continue
    for room in rooms:
        if not room.zone_id == zone.id:
            continue
        if room.data.get('hidden'):
            continue
        if 'doors' not in room.data or '--doors' in sys.argv:
            if 'doors' not in room.data:
                print(f'redoing doors for room #{room.id} - {room.key}')
            populate_room_doors(room)
            populate_room_elevators(room)
            room.save()
    process_zone(zone)