from django.conf import settings
import numpy as np
import os
from PIL import Image, ImageDraw

from maptroid.dzi import png_to_dzi
from maptroid.utils import mkdir

def set_transparency(image, dest=None, bg_color=(0, 0, 0)):
    if type(image) == str:
        image = Image.open(image)
    image = image.convert("RGBA")
    array = np.array(image, dtype=np.ubyte)
    image.close()
    mask = (array[:,:,:3] == bg_color).all(axis=2)
    alpha = np.where(mask, 0, 255)
    array[:,:,-1] = alpha
    result = Image.fromarray(np.ubyte(array))
    if dest:
        result.save(dest, "PNG")
    return result

def make_holes(image, holes):
    mask = Image.new('L', image.size, color = 255)
    draw = ImageDraw.Draw(mask)
    for x, y in holes:
        draw.rectangle((x*256, y*256, (x+1) * 256, (y+1) * 256), fill=0)
    image.putalpha(mask)

def process_zone(zone):
    world = zone.world
    CACHE_DIR = mkdir(settings.MEDIA_ROOT, f'sm_cache/{world.slug}')
    ROOM_DIR = mkdir(settings.MEDIA_ROOT, f'sm_room/{world.slug}')
    ZONE_DIR = mkdir(settings.MEDIA_ROOT, f'sm_zone/{world.slug}')

    rooms = zone.room_set.all()
    x_min = min([r.data['zone']['bounds'][0] for r in rooms])
    y_min = min([r.data['zone']['bounds'][1] for r in rooms])

    zone.normalize()

    _, _, zw, zh = zone.data['world']['bounds']
    zone_image = Image.new('RGBA', ((zw) * 256, (zh) * 256), (0, 0, 0, 0))
    for room in rooms:
        x, y, width, height = room.data['zone']['bounds']
        room_image = Image.new('RGBA', (int(width) * 256, int(height) * 256), (0, 0, 0, 0))
        for layer in ['layer-2', 'layer-1']:
            path = os.path.join(settings.MEDIA_ROOT, f'smile_exports/{world.slug}/{layer}/{room.key}')
            layer_path = os.path.join(CACHE_DIR, f'{layer}__{room.key}')
            layer_image = set_transparency(path, dest=layer_path)
            room_image.paste(layer_image, (0,0), mask=layer_image)
        if 'holes' in room.data:
            make_holes(room_image, room.data['holes'])
        room_image.save(os.path.join(ROOM_DIR, room.key))
        zone_image.paste(room_image, (x * 256, y * 256), mask=room_image)
    dest = os.path.join(ZONE_DIR, f'{zone.slug}.png')
    zone_image.save(dest)
    zone_image.close()
    png_to_dzi(dest)

    zone.data['dzi'] = os.path.join(settings.MEDIA_URL, f'sm_zone/{world.slug}/{zone.slug}.dzi')
    zone.save()