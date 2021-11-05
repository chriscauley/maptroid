from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
import math
import os
from PIL import Image
import sys

from maptroid.dread import mkdir
from maptroid.models import World, Zone, Screenshot

def process_zone(request, world_id=None, zone_id=None):
    zone = get_object_or_404(Zone, id=zone_id)
    world = get_object_or_404(World, id=world_id)
    if not 'output' in zone.data or request.GET.get('force'):
        process(zone, world)
    return JsonResponse(zone.data)

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
    passes = sorted(passes, key=lambda i: -i[1]) # bottom images first to mitigate shadow problem
    for [ratio_x, ratio_y, screenshot] in passes:
        x = int(px_width * (ratio_x - ratio_bounds['min_x']))
        y = int(px_width * (ratio_y - ratio_bounds['min_y']))
        _screenshot = Image.open(screenshot.output)
        image.paste(_screenshot, (x, y), mask=_screenshot)
        _screenshot.close()

    path = f'dread_zones/{zone.id}-{zone.name}.png'
    mkdir(settings.MEDIA_ROOT, f'dread_zones/{world.id}')
    image.save(os.path.join(settings.MEDIA_ROOT, path))
    zone.data['output'] = {
        'png': os.path.join(settings.MEDIA_URL, path),
        'dzi': os.path.join(settings.MEDIA_URL, f'dread_zones/{zone.id}-{zone.name}.dzi'),
        'screenshot_count': screenshots.count(),
        'ratio_bounds': ratio_bounds,
        'fails': fails,
    }
    zone.save()