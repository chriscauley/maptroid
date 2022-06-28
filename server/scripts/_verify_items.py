from _setup import get_wzr

import cv2
import numpy as np
import os
import urcv

from labbook import Labbook
from maptroid import plm
from sprite.cached import match_item, get_matchedsprite_image


world, zones, rooms = get_wzr()

def safe_open(path):
    if not os.path.exists(path):
        return []
    return cv2.imread(path, cv2.IMREAD_UNCHANGED)


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
            if item:
                room_xy = (x // 16, y // 16)
                existing_item = existing_items.pop(room_xy, None)
                if not existing_item:
                    extra_items[room_xy] = item
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
    if extra_items:
        book.warn(f"Item in plm_image not found in database {_repr}\n{extra_items}")
    book.close()
