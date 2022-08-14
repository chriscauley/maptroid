# Extract PlmSprites from .media/smile_exports/WORLD/plm_enemies/ROOM_KEY

from _setup import get_wzr

from maptroid import plm

def main(rooms):
    world, zones, rooms = get_wzr()
    fails = []
    hashes = []
    matches = {}
    match = miss = 0

    for room in rooms:
        if not 'plm_enemies' in room.data:
            fails.append(f'FAIL: missing data.plm_enemies for #{room.id} {room.key}')
            continue
        plms = [plm for plm in room.data['plm_enemies'] if not plm.get('deleted')]
        if len(plms) != len(set([str(p['xy']) for p in plms])):
            fails.append(f'FAIL: room has confusing plms: {room.name or room.id}')
            continue
        plm.finalize(room)
        hashes += plm.extract_plmsprites_from_room(room)

    for hash_ in hashes:
        if hash_ in matches:
            match += 1
        else:
            matches[hash_] = True
            miss += 1

    print(f'miss:{miss}, match:{match}')
    for f in fails:
        print(f)

if __name__ == '__main__':
    _, _, rooms = get_wzr()
    main(rooms)
