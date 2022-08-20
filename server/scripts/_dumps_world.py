from _setup import get_wzr

import json

def main():
    world, zones, rooms = get_wzr()

    out = {
        'world': {
            key: getattr(world, key)
            for key in ['slug', 'name', 'data', 'mc_id']
        },
        'zones': [],
        'rooms': [],
    }

    zone_slug_by_id = {}

    for zone in zones:
        out['zones'].append({
            key: getattr(zone, key)
            for key in ['slug', 'name', 'data']
        })
        zone_slug_by_id[zone.id] = zone.slug

    for room in rooms:
        item = {
            key: getattr(room, key)
            for key in ['key', 'data']
        }
        item['zone_slug'] = zone_slug_by_id[room.zone_id]
        out['rooms'].append(item)

    with open(f'./{world.slug}.json', 'w') as f:
        f.write(json.dumps(out))
    print(f"successfully wrote {world.slug}.json")

if __name__ == "__main__":
    main()