from _setup import get_wzr

import cv2
import numpy as np
import os
import sys
import urcv

from labbook import Labbook
from maptroid.models import Item
from maptroid import plm
from sprite.models import MatchedSprite
from sprite.cached import match_item, get_matchedsprite_image

world, zones, rooms = get_wzr(exclude_hidden=True)

def safe_open(path):
    if not os.path.exists(path):
        return []
    return cv2.imread(path, cv2.IMREAD_UNCHANGED)

to_create = 0

def goc_item(room, sprite_id, xy):
    sprite = MatchedSprite.objects.get(id=sprite_id)
    item = room.item_set.filter(data__room_xy=xy, data__type=sprite.type).first()
    if not item:
        item = Item.objects.create(
            data={'room_xy': xy, 'type': sprite.type},
            room=room,
            zone=room.zone
        )
        print(f'item created {item.data["type"]} in {item.room.name or item.room.id} @ {xy}')
    item.data['modifier'] = sprite.modifier
    item.save()

dryrun_rooms = []

for room in rooms:
    book = Labbook(f'_verify_items__{room.id}')
    plm_dir = f'.media/smile_exports/{world.slug}/plm_enemies/'
    canvas = safe_open(f'{plm_dir}{room.key}')
    existing_items = {}
    extra_items = {}
    for item in room.item_set.all():
        existing_items[tuple(item.data['room_xy'])] = item.data['type']

    room_plmsprites = sorted(room.roomplmsprite_set.all(), key=lambda rps: rps.xy)
    _repr = f"#{room.id} {room}"
    if not room_plmsprites and np.sum(canvas):
        book.warn(f"Warning: No room plmsprites found for {_repr}")
    for room_plmsprite in room_plmsprites:
        plmsprite = room_plmsprite.plmsprite
        x0, y0 = room_plmsprite.xy
        for match_id, x, y in plm.matcher.lookup(plmsprite):
            item = match_item(match_id)
            x += x0
            y += y0
            if room.data.get('plm_overrides', {}).get(f'{x // 16},{y // 16}') == 'wipe':
                continue
            if item:
                room_xy = (x // 16, y // 16)
                screen_xy = [i // 16 for i in room_xy]
                if screen_xy in room.data['holes']:
                    continue
                existing_item = existing_items.pop(room_xy, None)
                if not existing_item:
                    extra_items[room_xy] = [match_id, item]
            matched_image = get_matchedsprite_image(match_id)
            matched_image = cv2.cvtColor(matched_image, cv2.COLOR_BGRA2RGBA)
            urcv.draw.paste_alpha(canvas, matched_image, x, y)
            book.add({
              'np': canvas,
              'caption': f'paste @ {x}, {y}',
            })
    if len(rooms) == 1:
        book.warn('only one room, warning to trigger print')
    if existing_items:
        book.warn(f"Item in DB is not in plm_image {_repr}\n{existing_items}")
        book.warn(room.get_dev_url())
    if extra_items:
        to_create += len(extra_items)
        dryrun_rooms.append(room)
        if '--dry-run' not in sys.argv:
            for xy, (match_id, _type) in extra_items.items():
                goc_item(room, match_id, xy)
        else:
            book.warn(f"Item in plm_image not found in database {_repr}\n{extra_items}")
    book.close()

if to_create:
    if '--dry-run' not in sys.argv:
        print(f'{to_create} new items were created')
    else:
        print(f'{to_create} missing items will be created if rerun without --dry-run flag')
        for room in set(dryrun_rooms):
            print(room.get_dev_url())
