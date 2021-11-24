import _setup

from django.conf import settings
import json
import imagehash
import np
import os
from PIL import Image
import pytesseract

from maptroid.models import Room

WORLD = "super_metroid"

coords = {
  'workarea': (8, 132, 1031, 899),
  'smile_id': (1066, 136, 1113, 148),
  'event_name': (1135, 136, 1296, 148),
}

SOURCE_DIR = os.path.join(settings.MEDIA_ROOT, 'plm_enemies')

def get_dir(name):
  out = os.path.join(SOURCE_DIR, name)
  if not os.path.exists(out):
    os.mkdir(out)
  return out

DIRS = {
  'output': get_dir('output'),
  'cache': get_dir('cache'),
  'json': get_dir('cache/json'),
  'letters': get_dir('cache/letters'),
  'room_name': get_dir('cache/room_name'),
  'smile_id': get_dir('cache/smile_id'),
  'event_name': get_dir('cache/event_name'),
  'workarea': get_dir('cache/workarea'),
  'cropped_area': get_dir('cache/cropped_area'),
}

class JsonCache(dict):
  def __init__(self, name, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self._path = os.path.join(settings.STATIC_ROOT, name+'.json')
    if os.path.exists(self._path):
      with open(self._path, 'r') as f:
        self.update(json.loads(f.read()))
  def __setitem__(self, *args):
    super().__setitem__(*args)
    self._save()
  def _save(self):
    with open(self._path, 'w') as f:
      f.write(json.dumps(self))

def replace_color(img, color1, color2):
  data = np.array(img)
  data[(data == color1).all(axis = -1)] = color2
  return Image.fromarray(data, mode='RGB')

def get_cached_image(image_name, dest_key, function, force=False):
  target_path = os.path.join(DIRS[dest_key], image_name)
  if not force and os.path.exists(target_path):
    return Image.open(target_path)

  image = Image.open(os.path.join(SOURCE_DIR, image_name))
  print(f'writing {dest_key} for {image_name}')
  image = function(image)
  image.save(target_path)
  return image

data = {
  'room_keys': {},
  'count': 0,
  'all_keys': set(),
  'missing_smile_id': 0,
  'missing_event_name': 0,
}

hash_to_letter = JsonCache('hash_to_letter')

def read_text(ss_name, type_, coords):
  if ss_name in data['room_keys']:
    return data['room_keys'][ss_name]
  def crop_room_name(image):
    cropped = image.crop(coords).convert("L").convert("RGB")
    bg_color = cropped.getpixel((0, 0))
    cropped = replace_color(cropped, [0,0,0], [255,255,255])
    cropped = replace_color(cropped, bg_color, [0,0,0])
    return cropped

  cropped_room_name = get_cached_image(ss_name, type_, crop_room_name)

  width, height = cropped_room_name.size
  hashes = []
  current = []
  last = 0
  for x in range(width):
    col = sum([cropped_room_name.getpixel((x,y))[0]//255 for y in range(height)])
    if col:
      if not last:
        current = []
        hashes.append(current)
      current.append(str(col))
    last = col

  hashes = [','.join(h) for h in hashes]
  matched_letters = ' '.join([hash_to_letter.get(h, '?') for h in hashes])
  if '?' in matched_letters:
    url = os.path.join(settings.MEDIA_URL, DIRS[type_].split('.media/')[-1], ss_name)
    hash_to_letter['__missing'].append([url, hashes])
    hash_to_letter._save()
    return
  return matched_letters.replace(' ','')


if __name__ == '__main__':
  rooms = Room.objects.filter(world__slug=WORLD)
  hash_to_letter['__missing'] = []

  for ss_name in os.listdir(SOURCE_DIR):
    if not ss_name.endswith('png'):
      continue

    image = Image.open(os.path.join(SOURCE_DIR, ss_name))
    workarea = get_cached_image(ss_name, 'workarea', lambda i: i.crop(coords['workarea']))
    key = read_text(ss_name, 'smile_id', coords['smile_id'])
    if not key:
      data['missing_smile_id'] += 1
      continue

    event = read_text(ss_name, 'event_name', coords['event_name'])
    if not event:
      data['missing_event_name'] += 1

    data['all_keys'].add(key)
    room = rooms.filter(key__icontains=key).first()
    if not room:
      print("missing room:", key)
      continue
    # room.data['plm_enemies'] = room.data.get('plm_enemies') || []

  if data['missing_smile_id'] or data['missing_event_name']:
    print(f"missing {data['missing_smile_id']} smile_ids")
    print(f"missing {data['missing_event_name']} event names")
  print(f'{len(data["all_keys"])} / {rooms.count()} rooms with entries')
  # if not _str.startswith("79"):
  #   print(_str)
  #   cropped_room_name.save(os.path.join(DEST_DIR, f'cropped_room_name{_str}.png'))
