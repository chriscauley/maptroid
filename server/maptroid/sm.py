from django.conf import settings
import numpy as np
import os
from PIL import Image, ImageDraw

from maptroid.dzi import png_to_dzi
from maptroid.utils import mkdir
import unrest_image as img


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

def make_holes(image, holes, color=(0,0,0,0)):
    format_ = img._get_format(image)
    image = img._coerce(image, 'np')
    for x, y in holes:
        image[y*256:(y+1) * 256,x*256:(x+1) * 256,:] = [0,0,0,0]
    return img._coerce(image, format_)

def process_zone(zone):
    world = zone.world
    CACHE_DIR = mkdir(settings.MEDIA_ROOT, f'sm_cache/{world.slug}')
    ROOM_DIR = mkdir(settings.MEDIA_ROOT, f'sm_room/{world.slug}')
    ZONE_DIR = mkdir(settings.MEDIA_ROOT, f'sm_zone/{world.slug}')
    BTS_DIR = mkdir(settings.MEDIA_ROOT, f'sm_zone/{world.slug}/bts')

    rooms = zone.room_set.all()
    x_min = min([r.data['zone']['bounds'][0] for r in rooms])
    y_min = min([r.data['zone']['bounds'][1] for r in rooms])

    def make_layered_zone_image(zone, layers, dest):
        _, _, zw, zh = zone.data['world']['bounds']
        zone_image = Image.new('RGBA', ((zw) * 256, (zh) * 256), (0, 0, 0, 0))
        layers_dir = mkdir(CACHE_DIR, '+'.join(layers))
        for room in rooms:
            x, y, width, height = room.data['zone']['bounds']
            room_image = Image.new('RGBA', (int(width) * 256, int(height) * 256), (0, 0, 0, 0))
            for layer in layers:
                path = os.path.join(settings.MEDIA_ROOT, f'smile_exports/{world.slug}/{layer}/{room.key}')
                layer_dir = mkdir(CACHE_DIR, layer)
                layer_path = os.path.join(layer_dir, room.key)
                layer_image = img._coerce(path, 'pil')
                layer_image = layer_image.convert('RGBA')
                layer_image = img.replace_color(path, (0,0,0,255),(0,0,0,0))
                layer_image.save(layer_path)
                room_image.paste(layer_image, (0,0), mask=layer_image)
            if 'holes' in room.data:
                room_image = make_holes(room_image, room.data['holes'])
            img._coerce(room_image, 'pil').save(os.path.join(layers_dir, room.key))
            zone_image.paste(room_image, (x * 256, y * 256), mask=room_image)
        dest = os.path.join(ZONE_DIR, f'{zone.slug}.png')
        zone_image.save(dest)
        zone_image.close()
        png_to_dzi(dest)


    zone.normalize()

    make_layered_zone_image(zone, ['layer-1'], os.path.join(ZONE_DIR, f'{zone.slug}.png'))
    zone.data['dzi'] = os.path.join(settings.MEDIA_URL, f'sm_zone/{world.slug}/{zone.slug}.dzi')

    make_layered_zone_image(zone, ['bts'], os.path.join(BTS_DIR, f'{zone.slug}.png'))
    zone.data['bts_dzi'] = os.path.join(settings.MEDIA_URL, f'sm_zone/{world.slug}/bts/{zone.slug}.dzi')

    zone.save()


