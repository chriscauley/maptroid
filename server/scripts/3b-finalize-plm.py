#after hatches are done, make plmsprites for a room

from _setup import get_wzr

from maptroid.plm import extract_plmsprites_from_room

world, zones, rooms = get_wzr(exclude_hidden=True)
hashes = []
matches = {}
match = miss = 0

for room in rooms:
    hashes += extract_plmsprites_from_room(room)

for hash_ in hashes:
    if hash_ in matches:
        match += 1
    else:
        matches[hash_] = True
        miss += 1

print(f'miss:{miss}, match:{match}')

