# takes screenshots from ./media/smile_exports/WORLD/plm_enemies/batchNUMBER/
# crops, parses room_key/event_name, and assigns to room with best guess of position

from _setup import get_wzr

from collections import defaultdict
from django.conf import settings
from django.core.files.base import ContentFile
import json
import imagehash
import math
import numpy as np
import os
from PIL import Image
import sys
import unrest_image as img
from unrest.utils import JsonCache

from maptroid.models import Room
from maptroid.sm import set_transparency, to_media_url


world, _, rooms = get_wzr()

BIN = 16

SMILE_BG = (128, 128, 255, 255)
coords = {
    'batch1': {
        'workarea': (8, 132, 1031, 899),
        'smile_id': (1066, 136, 1113, 148),
        'event_name': (1135, 136, 1296, 148),
    },
    'batch2': {
        'workarea': (8, 141, 1031, 907),
        'smile_id': (1066, 145, 1113, 157),
        'event_name': (1135, 145, 1295, 157),
    },
    'batch3': {
        'workarea': (0, 133, 1613, 989),
        'smile_id': (1648, 138, 1695, 149),
        'event_name': (1718, 138, 1879, 149),
    },
    'batch4': {
        "workarea": (0, 122, 1280, 1024),
        "smile_id": (90, 105, 52, 17),
        "event_name": (163, 105, 166, 17),
    },
}

SOURCE_DIR = os.path.join(settings.MEDIA_ROOT, f'smile_exports/{world.slug}/plm_enemies')

def get_dir(name, wipe=False):
    out = os.path.join(SOURCE_DIR, name)
    if not os.path.exists(out):
        print('made', out)
        os.mkdir(out)
    if wipe:
        for f in os.listdir(out):
            os.remove(os.path.join(out, f))
    return out

DIRS = {
    'output': get_dir('output'),
    'cache': get_dir('cache'),
    'json': get_dir('cache/json'),
    'smile_id': get_dir('cache/smile_id'),
    'event_name': get_dir('cache/event_name'),
    'workarea': get_dir('cache/workarea'),
    'cropped_area': get_dir('cache/cropped_area'),
    'processed': get_dir('cache/processed'),
}

def get_cached_image(image_name, dest_key, function, force=False):
    print(image_name)
    def func2():
        image = Image.open(os.path.join(SOURCE_DIR, data['batch_name'], image_name))
        image = image.convert('RGBA')
        return function(image)
    image, new = img.get_or_create(image_name, func2, DIRS[dest_key], force=force)
    if new:
        print(f"Created image {dest_key} {image_name}")
    return image


data = {
    'room_keys': {},
    'count': 0,
    'all_keys': set(),
    'missing_smile_id': 0,
    'missing_event_name': 0,
}

hash_to_letter = JsonCache(os.path.join(settings.BASE_DIR, '../static/smile/hash_to_letter.json'))

def read_text(ss_name, type_, coords):
    if ss_name in data['room_keys']:
        return data['room_keys'][ss_name]
    def crop_text(image):
        cropped = image.crop(coords).convert("L").convert("RGB")
        bg_color = cropped.getpixel((0, 0))
        cropped = img.replace_color(cropped, [0,0,0], [255,255,255])
        cropped = img.replace_color(cropped, bg_color, [0,0,0])
        cropped = img.replace_color(cropped, [128, 128, 128], [255, 255, 255])
        return cropped

    cropped_text = get_cached_image(ss_name, type_, crop_text)

    width, height = cropped_text.size
    hashes = []
    current = []
    last = 0
    for x in range(width):
        col = sum([cropped_text.getpixel((x,y))[0]//255 for y in range(height)])
        if col:
            if not last:
                current = []
                hashes.append(current)
            current.append(str(col))
        last = col

    hashes = [','.join(h) for h in hashes]
    matched_letters = ' '.join([hash_to_letter.get(h, '?') for h in hashes])
    if not len(hashes):
        print(type_, 'missing hashes',os.path.join(SOURCE_DIR, ss_name))
    if '?' in matched_letters:
        url = to_media_url(DIRS[type_], ss_name)
        hash_to_letter['__missing'].append([url, hashes])
        hash_to_letter._save()
        data['missing_' + type_] += 1
        return
    return matched_letters.replace(' ','')


def get_cropped_workarea(image):
    image = image.crop(coords[data['batch_name']]['workarea'])
    x, y = image.size
    x -= 1
    y -= 1
    while image.getpixel((0, y)) == SMILE_BG:
        y -= 1
    while image.getpixel((x, 0)) == SMILE_BG:
        x -= 1
    return set_transparency(image.crop((0,0,x,y)))


def load_plms(batch_name):
    batch_dir = os.path.join(SOURCE_DIR, batch_name)
    if not os.path.exists(batch_dir):
        print(f'no {batch_name} directory')
        return
    data['batch_name'] = batch_name
    processed = []
    for room in rooms:
        if '-f' in sys.argv:
            room.data.pop('plm_enemies', None)
            room.save()
        for plm in room.data.get('plm_enemies', []):
            processed.append(plm['source'])
    print(f'skipping {len(processed)} screenshots found in plm_enemies[:].source')
    hash_to_letter['__missing'] = []

    for ss_name in os.listdir(batch_dir):
        if not ss_name.endswith('png'):
            continue

        if ss_name in processed:
            continue

        image = Image.open(os.path.join(SOURCE_DIR, batch_name, ss_name))
        workarea = get_cached_image(ss_name, 'workarea', get_cropped_workarea)
        smile_id = read_text(ss_name, 'smile_id', coords[data['batch_name']]['smile_id'])
        if not smile_id:
            continue

        event = read_text(ss_name, 'event_name', coords[data['batch_name']]['event_name'])
        if not event:
            continue

        data['all_keys'].add(smile_id)
        room = rooms.filter(key__icontains=smile_id).first()
        if not room:
            print("missing room:", smile_id)
            continue

        room.data['plm_enemies'] = room.data.get('plm_enemies') or []
        og_dest = os.path.join(DIRS['processed'], ss_name)
        processed_fname = f'{smile_id}__{event}__{len(room.data["plm_enemies"])}.png'
        processed_dest = os.path.join(DIRS['processed'], processed_fname)
        image.save(og_dest)
        workarea.save(processed_dest)

        room.data['plm_enemies'].append({
            'root_url': to_media_url(DIRS['processed']),
            'source': ss_name,
            'cropped': processed_fname,
            'xy': guess_xy(workarea, room),
        })
        room.data.pop('plm_sprites', None) # force reprocess spirtes
        room.save()
        print(f'Room #{room.id} plm #{len(room.data["plm_enemies"])} processed!')

def guess_xy(workarea, room):
    wa_x, wa_y, wa_w, wa_h = coords[data['batch_name']]['workarea']
    xy = [0, 0]
    _x, _y, room_width, room_height = [i*256 for i in room.data['zone']['bounds']]
    workarea_width, workarea_height = workarea.size
    if workarea_width != room_width-1:
        if workarea_width != wa_w-wa_x-1:
            xy[0] = room_width - workarea_width - 1
    if workarea_height < room_height-1:
        if workarea_height < wa_h-wa_y-1:
            xy[1] = room_height - workarea_height - 1
    return xy


if __name__ == '__main__':
    for i in [1, 2, 3, 4]:
        load_plms(f'batch{i}')
    if data['missing_smile_id'] or data['missing_event_name']:
        print(f"missing {data['missing_smile_id']} smile_ids and {data['missing_event_name']} event names")
        if not '-f' in sys.argv:
            print("exiting. Rerun with -f flag to ignore missing event names and smile_ids")

    # don't show rooms from trash in totals
    missing_rooms = rooms.filter(data__plm_enemies__isnull=True)
    missing_rooms = sorted([r.key or '' for r in missing_rooms])
    if missing_rooms:
        print('missing rooms', missing_rooms)
        for key in missing_rooms:
            print(Room.objects.get(key=key, world=world).get_dev_url())
    processed_count = rooms.filter(data__plm_enemies__isnull=False).count()
    print(f'{processed_count} / {rooms.count()} rooms have plm_enemies')
