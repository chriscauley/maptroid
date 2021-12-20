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


def get_occupied_world_xys(target_zone):
    occupied_xy_map = {}
    for zone in target_zone.world.zone_set.all():
        if zone.data.get('hidden'):
            continue
        zone_x, zone_y, _, _ = zone.data['world']['bounds']
        for room in zone.room_set.all():
            holes = room.data.get('holes') or []
            room_x, room_y, width, height = room.data['zone']['bounds']
            for dx in range(width):
                for dy in range(height):
                    if not [dx, dy] in holes:
                        zone_xy = f'{zone_x + room_x+dx},{zone_y + room_y+dy}'
                        occupied_xy_map[zone_xy] = room.id
    return occupied_xy_map

def process_zone(zone):
    if zone.data.get("hidden"):
        return
    zone.normalize()
    world = zone.world
    CACHE_DIR = mkdir(settings.MEDIA_ROOT, f'sm_cache/{world.slug}')
    ROOM_DIR = mkdir(settings.MEDIA_ROOT, f'sm_room/{world.slug}')
    ZONE_DIR = mkdir(settings.MEDIA_ROOT, f'sm_zone/{world.slug}')
    BTS_DIR = mkdir(settings.MEDIA_ROOT, f'sm_zone/{world.slug}/bts')

    rooms = zone.room_set.all()
    x_min = min([r.data['zone']['bounds'][0] for r in rooms])
    y_min = min([r.data['zone']['bounds'][1] for r in rooms])

    # Make note of which xys to punch out in the holes
    occupied_xy_map = get_occupied_world_xys(zone)

    def make_layered_zone_image(zone, layers, dest):
        zone_x, zone_y, zw, zh = zone.data['world']['bounds']
        zone_image = Image.new('RGBA', ((zw) * 256, (zh) * 256), (0, 0, 0, 0))
        layers_dir = mkdir(CACHE_DIR, '+'.join(layers))

        for room in rooms:
            room_x, room_y, width, height = room.data['zone']['bounds']
            room_image = Image.new('RGBA', (int(width) * 256, int(height) * 256), (0, 0, 0, 255))

            # this allows the clear_holes preference to be set from the top down
            zone_clear_holes = world.data.get('clear_holes') or zone.data.get('clear_holes')
            room_clear_holes = zone_clear_holes or room.data.get('clear_holes')

            for layer in layers:
                path = os.path.join(settings.MEDIA_ROOT, f'smile_exports/{world.slug}/{layer}/{room.key}')
                layer_dir = mkdir(CACHE_DIR, layer)
                layer_path = os.path.join(layer_dir, room.key)
                if not os.path.exists(path):
                    print(f'skipping {room.key} {layer} because file DNE')
                else:
                    layer_image = img._coerce(path, 'pil')
                    layer_image = layer_image.convert('RGBA')
                    layer_image = img.replace_color(path, (0, 0, 0, 255),(0, 0, 0, 0))
                    layer_image.save(layer_path)
                    room_image.paste(layer_image, (0, 0), mask=layer_image)
                    layer_image.close()
                holes = []

            for [dx, dy] in room.data.get('holes') or []:
                zone_xy = f'{zone_x + room_x + dx},{zone_y + room_y + dy}'
                if room_clear_holes or zone_xy in occupied_xy_map:
                    holes.append([dx, dy])
            room_image = img.make_holes(room_image, holes)
            room_image = img._coerce(room_image, 'pil')
            room_image.save(os.path.join(layers_dir, room.key))
            zone_image.paste(room_image, (room_x * 256, room_y * 256), mask=room_image)
            room_image.close()
        zone_image.save(dest)
        zone_image.close()
        if zw > 70 or zh > 70:
            print(f'WARNING: skippind dzi for {zone.name} because bounds are too large: {zw}x{zh}')
        else:
            png_to_dzi(dest)


    zone.normalize()

    make_layered_zone_image(zone, ['layer-2', 'layer-1'], os.path.join(ZONE_DIR, f'{zone.slug}.png'))
    zone.data['dzi'] = os.path.join(settings.MEDIA_URL, f'sm_zone/{world.slug}/{zone.slug}.dzi')

    make_layered_zone_image(zone, ['bts'], os.path.join(BTS_DIR, f'{zone.slug}.png'))
    zone.data['bts_dzi'] = os.path.join(settings.MEDIA_URL, f'sm_zone/{world.slug}/bts/{zone.slug}.dzi')

    zone.save()


