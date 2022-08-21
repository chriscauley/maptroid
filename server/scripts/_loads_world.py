import _setup

import json
from maptroid.models import World, Zone, Room, Item
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
    room_id_by_room_key = {}
    room_matched_items = {}

    for entity in data['zones']:
        entity['world_id'] = world.id
        zone = get_or_create(Zone, entity)
        zone_id_by_zone_slug[zone.slug] = zone.id

    for entity in data['rooms']:
        entity['world_id'] = world.id
        entity['zone_id'] = zone_id_by_zone_slug[entity.pop('zone_slug')]
        room = get_or_create(Room, entity)
        room_id_by_room_key[room.key] = room.id
        room_matched_items[room.id] = {}
        for item in room.item_set.all():
            xy = tuple(item.data['room_xy'])
            room_matched_items[room.id][xy] = item.data['type']

    for entity in data['items']:
        room_id = room_id_by_room_key[entity.pop('room_key')]
        xy = tuple(entity['data']['room_xy'])
        matched_item = room_matched_items[room_id].get(xy)
        if matched_item is None:
            entity['room_id'] = room_id
            entity['zone_id'] = zone_id_by_zone_slug[entity.pop('zone_slug')]
            item = Item.objects.create(**entity)
            print("Item created:", entity)
        elif matched_item != entity['data']['type']:
            raise ValueError(f"Attempting to create item where '{matched_item}' exists")

if __name__ == "__main__":
    main(sys.argv[1])