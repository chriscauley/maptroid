from _setup import get_world_from_argv

from maptroid.models import SmileSprite, Room, Item

def populate_items(room):
    for sprite_id, xy in room.data['plm_sprites']:
        XY = [int(xy[0]/16), int(xy[1]/16)]
        if XY in room.data['holes']:
            continue
        sprite = SmileSprite.objects.get(id=sprite_id)
        if sprite.category != 'item':
            continue
        item = room.item_set.filter(data__room_xy=xy, data__type=sprite.type).first()
        if not item:
            item = Item.objects.create(
                data={'room_xy': xy, 'type': sprite.type},
                room=room,
                zone=room.zone
            )
            print(f'item created {item.data["type"]} in {item.room.name}')
        item.data['modifier'] = sprite.modifier
        item.save()


if __name__ == "__main__":
    world = get_world_from_argv()
    for room in world.room_set.all():
        if room.data.get('hidden'):
            continue
        if 'plm_sprites' not in room.data:
            print(f'room #{room.id} missing plm_sprites')
            continue
        populate_items(room)
