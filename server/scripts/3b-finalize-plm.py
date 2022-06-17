from _setup import get_world_zones_from_argv

from maptroid.plm import extract_plmsprites_from_room

world, zones = get_world_zones_from_argv(exclude_hidden=True)
hashes = []
matches = {}
match = miss = 0

for zone in zones:
    for room in zone.room_set.all():
        hashes += extract_plmsprites_from_room(room)

for hash_ in hashes:
    if hash_ in matches:
        match += 1
    else:
        matches[hash_] = True
        miss += 1

print(f'miss:{miss}, match:{match}')

