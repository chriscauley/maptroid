from django.conf import settings
from django.http import JsonResponse, HttpResponseNotFound, FileResponse
import functools
import json
import os
import cv2
from maptroid.utils import get_winderz
from maptroid.models import Room

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

# TOOD Move this to maptroid views?
@superuser_required
def sink(request, path):
    file_path = os.path.join(settings.MAPTROID_SINK_PATH, path)
    file_name = file_path.split('/')[-1]
    response = FileResponse(open(file_path,'rb'), content_type="image/png")
    return response


@superuser_required
def swap_room_event(request):
    data = json.loads(request.body.decode('utf-8') or "{}")
    root = os.path.join(settings.MAPTROID_SINK_PATH, data['world_slug'], data['layer'])
    source = os.path.join(root, data['source_event'], data['key'])
    target = os.path.join(root, data['target_event'], data['key'])
    winderz = get_winderz(data['world_slug'])
    winderz['room_errors'][data['smile_id']].pop(data['error_key'])
    if not winderz['room_errors'][data['smile_id']]:
        winderz['room_errors'].pop(data['smile_id'])
    if os.path.exists(target):
        _trash = os.path.join(root, data['target_event'], "_trash__"+data['key'])
        cv2.imwrite(_trash, cv2.imread(target, cv2.IMREAD_UNCHANGED))
    cv2.imwrite(target, cv2.imread(source, cv2.IMREAD_UNCHANGED))
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