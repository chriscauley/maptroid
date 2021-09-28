import json
import os
from django.conf import settings
from django.http import JsonResponse

def list_dir(request):
  path = os.path.join(settings.MEDIA_ROOT, request.GET['path'])
  files = []
  directories = []
  for fname in os.listdir(path):
    if os.path.isdir(os.path.join(path,fname)):
      directories.append(fname)
    else:
      files.append(fname)
  return JsonResponse({ 'files': files, 'directories': directories })

def delete_file(request):
  if request.method != 'DELETE':
    return JsonResponse({}, status=405)
  data = json.loads(request.body.decode('utf-8') or "{}")
  path = data['path'].split(settings.MEDIA_URL)[-1]
  path = os.path.join(settings.MEDIA_ROOT, path)
  if not (os.path.exists(path) and os.path.isfile(path)):
    return JsonResponse({'message': "Cannot delete path:"+path}, status=400)
  os.remove(path)
  return JsonResponse({'message': 'ok'})