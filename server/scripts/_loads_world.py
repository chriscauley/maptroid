import _setup

import json
from maptroid.models import World, Zone, Room
import sys

def get_or_create(model, data):
    lookup = {
        field: data[field]
        for field in ['slug', 'world_id', 'key']
        if field in data
    }
    try:
        obj = model.objects.get(**lookup)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
    except model.DoesNotExist:
        print(f'Created new {model}: {obj}')
        obj = model.objects.create(**data)
    return obj


def main(file_path):
    with open(file_path, 'r') as f:
        data = json.loads(f.read())

    world = get_or_create(World, data['world'])

    zone_id_by_zone_slug = {}

    for item in data['zones']:
        item['world_id'] = world.id
        zone = get_or_create(Zone, item)
        zone_id_by_zone_slug[zone.slug] = zone.id

    for item in data['rooms']:
        item['world_id'] = world.id
        item['zone_id'] = zone_id_by_zone_slug[item.pop('zone_slug')]
        get_or_create(Room, item)

if __name__ == "__main__":
    main(sys.argv[1])