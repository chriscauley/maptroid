import _setup
import os
from django.conf import settings
import imagehash
import numpy as np
import unrest_image as img

from maptroid.models import Room, SmileSprite, SpriteMatcher
from maptroid.utils import mkdir

BASE_DIR = mkdir(settings.MEDIA_ROOT,'plm_enemies/sprites')
WORLD = 'super_metroid'

_dirs = ['outline']
DIRS = { k: mkdir(BASE_DIR, 'k') for k in _dirs }

def extract_sprites(image, smile_id):
  pixels = 0
  x_max = len(image[0])
  y_max = len(image)
  sprites = []
  xys = []
  for y1, row in enumerate(image):
    if not np.sum(row):
      # skipping empty rows saves a lot of time
      continue
    for x1, pixel in enumerate(row):
      if not np.sum(pixel):
        continue

      # starting 4 out assuming no thing will be smaller than 4x4
      _s = 4
      x2 = x1 + _s
      y2 = y1 + _s
      while x2 < x_max+4 and y2 < y_max+4:
        if np.sum(image[y2:y2+_s,x1:x2]):
          y2 += _s
        elif np.sum(image[y1:y2,x2:x2+_s]):
          x2 += _s
        elif np.sum(image[y1:y2,x1-_s:x1]):
          x1 -= _s
        else:
          break

      _count = len(sprites)
      while np.sum(image[y1:y1+1,x1:x2]) == 0:
        y1 += 1
      while np.sum(image[y2-1:y2,x1:x2]) == 0:
        y2 -= 1
      while np.sum(image[y1:y2,x1:x1+1]) == 0:
        x1 += 1
      while np.sum(image[y1:y2,x2-1:x2]) == 0:
        x2 -= 1
      sprites.append(img._coerce(image[y1:y2,x1:x2], 'np'))
      xys.append([x1, y1])
      image[y1:y2,x1:x2] = [0,0,0,0]
  return sprites, xys


def media_url_to_path(url):
  return os.path.join(settings.MEDIA_ROOT, url.split(settings.MEDIA_URL)[-1])

def main():
  rooms = Room.objects.filter(world__slug=WORLD)
  rooms = rooms.filter(id=19)
  fails = 0
  matcher = SpriteMatcher()
  for room in rooms:
    if '7E82C' in room.key: # force skip junk room by adding them to here
      print('skipping', room)
      room.data['trash'] = True
      room.save()
      continue
    # DANGER ZONE: uncomment next line to wipe all
    room.data['plm_sprites'] = []
    if room.data.get('plm_sprites') or room.data.get('trash'):
      continue
    smile_id = room.key.split("_")[-1].split('.')[0]
    plms = [plm for plm in room.data['plm_enemies'] if not plm.get('deleted')]
    if len(plms) != len(set([str(p['xy']) for p in plms])):
      fails += 1
      print('FAIL: room has confusing plms:', room.name)
      continue
    if not len(plms):
      fails += 1
      print('FAIL: room has confusing plms:', room.name)
      continue

    room.data['plm_sprites'] = []
    path = os.path.join(settings.MEDIA_ROOT, f'sm_room/{WORLD}/{room.key}')
    sprite_canvas = img._coerce(path, 'np')
    sprite_canvas[:,:,:] = 0
    for plm in plms:
      cropped_path = media_url_to_path(os.path.join(plm['root_url'], plm['cropped']))
      cropped_data = img._coerce(cropped_path, 'np')
      x, y = plm['xy'] or [0, 0]
      height, width, _ = cropped_data.shape
      sprite_canvas[y:y+height, x:x+width] = cropped_data
    sprites, xys = extract_sprites(sprite_canvas, smile_id)
    for s, xy in zip(sprites, xys):
      sprite, new = matcher.get_or_create_from_image(s, 'plm')
      room.data['plm_sprites'].append([sprite.id, [round(i / 16) for i in xy]])
      if new:
        print("new sprite", sprite)
    room.save()

if __name__ == "__main__":
  main()
