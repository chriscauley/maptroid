from django.core.files.base import ContentFile
from django.conf import settings
from django.http import JsonResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from io import BytesIO
import imagehash
import json
import math
import numpy as np
import os
from PIL import Image, ImageDraw
import sys
import urllib

from maptroid.utils import mkdir
from maptroid.models import World, Zone, Screenshot, Room, SmileSprite

with open(os.path.join(settings.BASE_DIR, '../../client/src/lib/dread_colors.json'), 'r') as f:
    colors = json.load(f)

def process_zone(request, world_id=None, zone_id=None):
    zone = get_object_or_404(Zone, id=zone_id)
    world = get_object_or_404(World, id=world_id)
    if not 'output' in zone.data or request.GET.get('force'):
        process(zone, world)
    return JsonResponse(zone.data)


def replace_svg_color(request):
    if not request.user.is_superuser:
        raise NotImplementedError()
    data = json.loads(request.body.decode("utf-8"))
    _type = data['type']
    target = os.path.join(settings.BASE_DIR, f'../static/dread/icons/svg/{_type}.svg')
    if not os.path.exists(target):
        raise NotImplementedError()
    with open(target, 'w') as f:
        f.write(data['text'])
        f.close()
    return JsonResponse({})


def process(zone, world):
    # hardcoded dread values. OSD corrdinates are ratio of px_width
    px_width = 1280
    px_height = 430
    ratio_width = px_width/px_width
    ratio_height = px_height/px_width

    screenshots = Screenshot.objects.filter(zone=zone, world=world)
    ratio_bounds = {
        'max_x': -sys.maxsize - 1,
        'min_x': sys.maxsize,
        'max_y': -sys.maxsize - 1,
        'min_y': sys.maxsize,
    }
    fails = []
    passes = []
    for screenshot in screenshots:
        if not (screenshot.data.get('zone') or {}).get('xy'):
            fails.append(f'Screenshot #{screenshot.id} is missing positioning data')
            continue
        [x, y] = screenshot.data['zone']['xy']
        ratio_bounds['max_x'] = max(ratio_bounds['max_x'], x + ratio_width)
        ratio_bounds['max_y'] = max(ratio_bounds['max_y'], y + ratio_height)
        ratio_bounds['min_x'] = min(ratio_bounds['min_x'], x)
        ratio_bounds['min_y'] = min(ratio_bounds['min_y'], y)
        passes.append([x, y, screenshot])
    ratio_bounds['width'] = ratio_bounds['max_x'] - ratio_bounds['min_x']
    ratio_bounds['height'] = ratio_bounds['max_y'] - ratio_bounds['min_y']
    zone_width = math.ceil(px_width * ratio_bounds['width'])
    zone_height = math.ceil(px_width * ratio_bounds['height'])
    image = Image.new('RGBA', (zone_width, zone_height), (0, 0, 0, 0))

    draw = ImageDraw.Draw(image)
    scale = zone.data['screenshot']['px_per_block']
    x_offset = ratio_bounds['min_x'] * px_width / scale
    y_offset = ratio_bounds['min_y'] * px_width / scale

    for room in zone.room_set.all():
        [room_x, room_y, _w, _h] = room.data['zone_bounds']
        for color in room.data.get('colors') or []:
            hex_ = colors[color['color']]
            bounds = color['bounds']
            x1 = int(scale * (bounds[0] + room_x - x_offset))
            y1 = int(scale * (bounds[1] + room_y - y_offset))
            x2 = int(x1 + scale * bounds[2])
            y2 = int(y1 + scale * bounds[3])
            draw.rectangle((x1, y1, x2 ,y2), hex_)

    passes = sorted(passes, key=lambda i: -i[1]) # bottom images first to mitigate shadow problem
    for [ratio_x, ratio_y, screenshot] in passes:
        x = int(px_width * (ratio_x - ratio_bounds['min_x']))
        y = int(px_width * (ratio_y - ratio_bounds['min_y']))
        _screenshot = Image.open(screenshot.output)
        image.paste(_screenshot, (x, y), mask=_screenshot)
        _screenshot.close()

    path = zone.get_image_path('png')
    image.save(path)
    zone.data['output'] = {
        'png': zone.get_image_url('png'),
        'dzi': zone.get_image_url('dzi'),
        'screenshot_count': screenshots.count(),
        'ratio_bounds': ratio_bounds,
        'fails': fails,
    }
    zone.save()


def smile_ocr(request):
    if not request.user.is_superuser:
        raise NotImplementedError()
    cache_path = os.path.join(settings.BASE_DIR, '../sprite/hash_to_letter.json')
    if request.method == 'POST':
        data = json.loads(request.body.decode("utf-8"))
        with open(cache_path, 'w') as f:
            f.write(json.dumps(data, indent=2))
        return JsonResponse({})
    with open(cache_path, 'r') as f:
        letter_cache = json.load(f)
    return JsonResponse({ 'letter_cache': letter_cache })


def save_sprite(request):
    if not request.user.is_superuser:
        raise NotImplementedError()
    data = json.loads(request.body.decode("utf-8"))
    with urllib.request.urlopen(data['data_url']) as response:
        with open('/tmp/sprite.png', 'wb') as f:
            f.write(response.read())
    image = Image.open('/tmp/sprite.png')
    image.save(os.path.join(settings.MEDIA_ROOT, 'trash.png'))
    array = np.array(image)
    if np.sum(array) == 0:
        return JsonResponse({'message': 'Error: Sprite is empty'})
    x = y = 0
    x1, y1 = image.size
    while np.sum(array[y:y+1]) == 0:
        y += 1
    while np.sum(array[:,x:x+1]) == 0:
        x +=1
    while np.sum(array[:,x1-1:x1]) == 0:
        x1 -= 1
    while np.sum(array[y1-1:y1]) == 0:
        y1 -= 1

    cropped = image.crop((x,y,x1,y1))
    dhash = str(imagehash.dhash(cropped))
    color_sum = np.sum(array)
    if SmileSprite.objects.filter(dhash=dhash, color_sum=color_sum):
        message = "Sprite already exists"
    else:
        img_io = BytesIO()
        cropped.save(img_io, format="png")
        sprite = SmileSprite.objects.create(
            color_sum=color_sum,
            layer="plm",
            image=ContentFile(img_io.getvalue(), f'{dhash}__{color_sum}.png'),
            dhash=dhash,
        )
        message = "Sprite created"
    return JsonResponse({ 'message': message })

def sprite_distances(request):
    attrs = ['id', 'url', 'params']
    items = []
    for sprite in SmileSprite.objects.all():
        items.append({ attr: getattr(sprite,attr) for attr in attrs })

    for item in items:
        item['distances'] = {}
        for item2 in items:
            color1 = np.array(item['params']['main_color'])
            color2 = np.array(item2['params']['main_color'])
            color = np.abs(color1 - color2)

            distances = item['distances'][item2['id']] = {
                'dhash': int(item['params']['dhash'] - item2['params']['dhash']),
                'color_diff': [int(c) for c in color],
                'color': int(np.sum(color)),
                'both': 0,
            }

            if distances['color'] > 8:
                distances['both'] += (distances['color']-8)/8
            if distances['dhash'] > 8:
                distances['both'] += (distances['dhash']-8)/8
    for item in items:
        item.pop('params')
    return JsonResponse({ 'items': items })


def goto_room(request, room_id):
    room = get_object_or_404(Room, id=room_id)
    return HttpResponseRedirect(f'/sm/{room.world.slug}/?room={room.id}')