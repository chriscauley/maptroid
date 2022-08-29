from django.conf import settings
from django.http import JsonResponse, HttpResponseNotFound, FileResponse
from django.utils.text import slugify
import functools
import json
import os
import cv2
import numpy as np
import urcv

from maptroid.utils import get_winderz
from maptroid.models import Room, Zone

def superuser_required(func):
    @functools.wraps(func)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return HttpResponseNotFound("")
        if not request.user.is_superuser:
            return HttpResponseNotFound("")
        return func(request, *args, **kwargs)
    return wrapped

def get_path(path):
    path = path.split(settings.MEDIA_URL)[-1]
    return os.path.join(settings.MEDIA_ROOT, path)


@superuser_required
def list_dir(request):
    path = get_path(request.GET['path'])
    files = []
    directories = []
    for fname in os.listdir(path):
        if os.path.isdir(os.path.join(path,fname)):
            directories.append(fname)
        else:
            files.append(fname)
    return JsonResponse({ 'files': files, 'directories': directories })


@superuser_required
def delete_file(request):
    if request.method != 'DELETE':
        return JsonResponse({}, status=405)
    data = json.loads(request.body.decode('utf-8') or "{}")
    path = get_path(data['path'])
    if not (os.path.exists(path) and os.path.isfile(path)):
        return JsonResponse({'message': "Cannot delete path:"+path}, status=400)
    os.remove(path)
    return JsonResponse({'message': 'ok'})


@superuser_required
def swap_room_event(request):
    data = json.loads(request.body.decode('utf-8') or "{}")
    root = os.path.join(settings.SINK_DIR, data['world_slug'], data['layer'])
    source = os.path.join(root, data['source_event'], data['key'])
    target = os.path.join(root, data['target_event'], data['key'])
    winderz = get_winderz(data['world_slug'])
    room = Room.objects.get(world__slug = data['world_slug'], key=data['key'])

    if os.path.exists(target):
        _trash = os.path.join(root, data['target_event'], "_trash__"+data['key'])
        cv2.imwrite(_trash, cv2.imread(target, cv2.IMREAD_UNCHANGED))

    if data['source_event'] == 'coerce':
        # force the image to match the shape of the room
        # used when image is too small or large
        _,_,w,h = room.data['zone']['bounds']
        img = cv2.imread(target)
        shape = list(img.shape)
        shape[0] = h*256
        shape[1] = w*256
        fixed_img = np.zeros(shape, dtype=np.uint8)
        urcv.draw.paste(fixed_img, img, 0, 0)
        cv2.imwrite(target, fixed_img)
    elif data['source_event'] == 'reverse':
        # force the room to match the shape of the image
        # used when smile RF claims the room is bigger than it should be
        img = cv2.imread(target)
        H, W = img.shape[:2]
        room.data['zone']['bounds'][2] = W // 256
        room.data['zone']['bounds'][3] = H // 256
        room.save()
    elif data['source_event'] == 'delete':
        os.unlink(target)
        return JsonResponse(winderz)
    else:
        cv2.imwrite(target, cv2.imread(source, cv2.IMREAD_UNCHANGED))

    winderz['room_errors'][data['smile_id']].pop(data['error_key'])
    if not winderz['room_errors'][data['smile_id']]:
        winderz['room_errors'].pop(data['smile_id'])
    winderz._save()
    return JsonResponse(winderz)


@superuser_required
def winderz(request, world_slug):
    winderz = get_winderz(world_slug)
    return JsonResponse(winderz)


@superuser_required
def save_default_event(request):
    data = json.loads(request.body.decode('utf-8') or "{}")
    room = Room.objects.get(id=data['room_id'])
    if not data['default_event']:
        room.data.pop('default_event', None)
    else:
        room.data['default_event'] = data['default_event']
    room.save()
    return JsonResponse({"message": "ok"})


@superuser_required
def event_action(request):
    data = json.loads(request.body.decode('utf-8') or "{}")
    old_room = Room.objects.get(id=data['room_id'])
    action = data['action']
    event_name = data.get('event')
    event_slug = slugify(event_name)
    old_zone = old_room.zone
    world = old_room.world

    if action == 'split':

        # add event_slug to room.data.events
        if event_slug not in old_room.data.get('events', []):
            old_room.data['events'] = old_room.data.get('events', [])
            old_room.data['events'].append(event_slug)
            old_room.save()
            print('old_room event added')

        # add event_slug to world.data.events
        if event_slug not in world.data.get('events', []):
            world.data['events'] = world.data.get('events', [])
            world.data['events'].append(event_slug)
            world.save()
            print('world event added')

        # get or create zone and room
        zone2, new_zone = Zone.objects.get_or_create(
            world=world,
            slug=f'{old_zone.slug}__{event_slug}',
            defaults={
                'name': f'{old_zone.name} ({event_name})',
                'data': { 'event': event_slug },
            }
        )
        if new_zone:
            print('New zone:', zone2)

        new_room_key = old_room.key.replace('.png', f'__{event_slug}.png')
        new_data = {
            'zone': old_room.data['zone'],
            'event': event_slug,
        }

    elif action == 'copy':
        new_room_key = old_room.key.replace('.png', '__copy.png')
        new_data = old_room.data.copy()
        new_data['event'] = 'copy'
        zone2 = old_zone

    else:
        raise ValueError(f"unknown action: {action}")

    room2, new_room = Room.objects.get_or_create(
        key=new_room_key,
        world=world,
        defaults={
            'zone': zone2,
            'data': new_data,
            'name': old_room.name,
        }
    )

    if new_room:
        print('New room:', room2)

    # copy room images
    for layer in ['layer-1', 'layer-2', 'bts', 'bts-extra', 'plm_enemies']:
        layer_dir = os.path.join(settings.SINK_DIR, world.slug, layer)
        source = os.path.join(layer_dir, event_name, old_room.key)
        target = os.path.join(layer_dir, new_room_key)
        img = cv2.imread(source, cv2.IMREAD_UNCHANGED)
        cv2.imwrite(target, img)

    return JsonResponse({"message": "ok"})