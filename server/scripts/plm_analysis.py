import _setup

from collections import defaultdict
from django.conf import settings
from django.core.files.base import ContentFile
import json
import imagehash
import math
import np
import os
import unrest_image as img

from PIL import Image
import pytesseract

from maptroid.models import Room, SmileSprite
from maptroid.sm import set_transparency

WORLD = "super_metroid"
rooms = Room.objects.filter(world__slug=WORLD)
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
}

SOURCE_DIR = os.path.join(settings.MEDIA_ROOT, 'plm_enemies')

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

class JsonCache(dict):
  def __init__(self, name, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self._path = os.path.join(settings.BASE_DIR, '../static/smile', name+'.json')
    if os.path.exists(self._path):
      with open(self._path, 'r') as f:
        self.update(json.loads(f.read()))
  def __setitem__(self, *args):
    super().__setitem__(*args)
    self._save()
  def _save(self):
    with open(self._path, 'w') as f:
      f.write(json.dumps(self, indent=2))


def get_cached_image(image_name, dest_key, function, force=False):
  def func2():
    return function(Image.open(os.path.join(SOURCE_DIR, data['batch_name'], image_name)))
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

hash_to_letter = JsonCache('hash_to_letter')

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
    print(os.path.join(SOURCE_DIR, ss_name))
  if '?' in matched_letters:
    url = to_media_url(DIRS[type_], ss_name)
    hash_to_letter['__missing'].append([url, hashes])
    hash_to_letter._save()
    data['missing_' + type_] += 1
    return
  return matched_letters.replace(' ','')


def to_media_url(path, *args):
  return os.path.join(settings.MEDIA_URL, path.split('/.media/')[-1], *args)


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
  print('processing', batch_name)
  data['batch_name'] = batch_name
  processed = []
  for room in rooms:
    # uncomment this next line to reset all rooms
    # room.data.pop('plm_enemies', None); room.save()
    for plm in room.data.get('plm_enemies', []):
      processed.append(plm['source'])

  hash_to_letter['__missing'] = []

  for ss_name in os.listdir(os.path.join(SOURCE_DIR, batch_name)):
    if not ss_name.endswith('png'):
      continue

    if ss_name in processed:
      continue

    image = Image.open(os.path.join(SOURCE_DIR, batch_name, ss_name))
    workarea = get_cached_image(ss_name, 'workarea', get_cropped_workarea)
    smile_id = read_text(ss_name, 'smile_id', coords[data['batch_name']]['smile_id'])
    if not smile_id:
      continue
    print(f"'{smile_id}'")

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
      'xy': [0, 0],
    })
    room.save()
    print(f'Room #{room.id} plm #{len(room.data["plm_enemies"])} processed!')

def get_plm_image(room):
  if not 'plm_enemies' in room.data:
    return
  if len(room.data['plm_enemies']) > 1:
    return # TODO handle composite plms
  return Image.open(os.path.join(DIRS['processed'], room.data['plm_enemies'][0]['cropped']))


def reduce_image_16(image):
  image = np.array(image)
  reduced = np.add.reduce(image, 2) # colors are now numbers
  as_sprites = np.zeros(shape=[math.ceil(i/BIN) for i in reduced.shape], dtype=np.int32)
  height, width = as_sprites.shape
  for x in range(width):
    for y in range(height):
      as_sprites[y, x] = np.sum(reduced[y*BIN:(y+1)*BIN,x*BIN:(x+1)*BIN])
  assert(np.sum(as_sprites) == np.sum(image)) # no data lost
  return as_sprites

def extract_icons():
  sprite_cache = {}
  sprite_counts = defaultdict(int)
  for sprite in SmileSprite.objects.all():
    sprite_cache[sprite.color_sum] = sprite
  rooms = Room.objects.filter(world__slug=WORLD)[:1]
  for room in rooms:
    print(room.key)
    plm_image = get_plm_image(room)
    if not plm_image:
        continue
    reduced = reduce_image_16(plm_image.convert("RGB"))
    height, width = reduced.shape
    assert(height % BIN + width % BIN == 0)
    for y in range(height):
      for x in range(width):
        color_sum = reduced[y, x]
        if not color_sum:
          continue
        if not color_sum in sprite_cache:
          pass
          # sprite_image = plm_image.crop((x * 16, y * 16, (x+1)*16, (y+1)*16))
          # dhash = str(imagehash.dhash(sprite_image))
          # sprite = SmileSprite.objects.create(
          #   color_sum=color_sum,
          #   layer="plm",
          #   image=make_content_file(sprite_image),
          #   dhash=dhash,
          # )
          # sprite_cache[color_sum] = sprite
          # print('sprite created:', color_sum)
        sprite_counts[color_sum] += 1
  print(len({k:v for k,v in sprite_counts.items() if v > 2}))

if __name__ == '__main__':
  for i in [3]:
    load_plms(f'batch{i}')
  if data['missing_smile_id'] or data['missing_event_name']:
    print(f"missing {data['missing_smile_id']} smile_ids")
    print(f"missing {data['missing_event_name']} event names")
  print(sorted([r.key or '' for r in rooms.filter(data__plm_enemies__isnull=True)]))
  processed_count = rooms.filter(data__plm_enemies__isnull=False).count()
  print(f'{processed_count} / {rooms.count()} rooms have plm_enemies')
  # extract_icons()