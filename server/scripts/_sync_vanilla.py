# Syncs a map (room positions, zones, and geometry override)  with vanilla SM
# Useful for vanilla plus maps

import _setup
from maptroid.models import World
import sys

base_world = World.objects.get(slug = 'super-metroid')
new_world = World.objects.get(slug = sys.argv[1])

new_room_by_key = {}
base_room_by_key = {}

new_zone_by_slug = {}
base_zone_by_slug = {}
base_zone_by_id = {}

for room in base_world.room_set.all():
    key = room.key.split('_')[-1]
    base_room_by_key[key] = room

for room in new_world.room_set.all():
    key = room.key.split('_')[-1]
    new_room_by_key[key] = room

assert(sorted(new_room_by_key.keys()) == sorted(base_room_by_key.keys()))

for zone in base_world.zone_set.all():
    slug = zone.slug.split('-')[0]
    base_zone_by_slug[slug] = zone
    base_zone_by_id[zone.id] = zone

for new_zone in new_world.zone_set.all():
    slug = new_zone.slug.split('-')[0]
    if slug == 'unknown':
        continue
    new_zone_by_slug[slug] = zone
    base_zone = base_zone_by_slug[slug]
    new_zone.data = base_zone.data
    new_zone.save()

for key, new_room in new_room_by_key.items():
    base_room = base_room_by_key[key]
    new_room.name = base_room.key
    new_room.data['zone'] = base_room.data['zone']
    new_room.data['holes'] = base_room.data['holes']
    if 'geometry_override' in base_room.data:
        new_room.data['geometry_override'] = base_room.data['geometry_override']
    zone_slug = base_zone_by_id[base_room.zone_id].slug.split('-')[0]
    new_room.zone = new_zone_by_slug[zone_slug]
    new_room.save()