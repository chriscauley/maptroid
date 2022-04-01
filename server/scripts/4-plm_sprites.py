from _setup import get_world_from_argv
import os
from django.conf import settings
import imagehash
import numpy as np
import unrest_image as img

from maptroid.models import Room, SmileSprite, SpriteMatcher
from maptroid.utils import mkdir

template_sprites = SmileSprite.objects.filter(template=True).values_list('type', flat=True)

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
  world = get_world_from_argv()
  OUTPUT_DIR = mkdir(settings.MEDIA_ROOT,f'smile_exports/{world.slug}/plm_enemies/')

  rooms = Room.objects.filter(world=world)
  # rooms = rooms.filter(id=19)
  fails = 0
  matcher = SpriteMatcher()
  for room in rooms:
    if room.data.get('hidden'):
      continue
    smile_id = room.key.split("_")[-1].split('.')[0]
    if not 'plm_enemies' in room.data:
      print('missing plm_enemies:', room.id)
      continue
    plms = [plm for plm in room.data['plm_enemies'] if not plm.get('deleted')]
    if len(plms) != len(set([str(p['xy']) for p in plms])):
      fails += 1
      print('FAIL: room has confusing plms:', room.name)
      continue
    if not len(plms):
      fails += 1
      print('FAIL: room has confusing plms:', room.name)
      continue

    # make an empty canvas of the right size
    path = os.path.join(settings.MEDIA_ROOT, f'sm_cache/{world.slug}/layer-1/{room.key}')
    if not os.path.exists(path):
      print("WARNING unable to find layer-1 for", room.key)
      continue
    sprite_canvas = img._coerce(path, 'np')
    sprite_canvas[:,:,:] = 0

    room.data['plm_sprites'] = []
    for plm in plms:
      cropped_path = media_url_to_path(os.path.join(plm['root_url'], plm['cropped']))
      cropped_data = img._coerce(cropped_path, 'np')
      x, y = plm['xy'] or [0, 0]
      height, width, _ = cropped_data.shape
      sprite_canvas[y:y+height, x:x+width] = cropped_data
    img._coerce(sprite_canvas, 'pil').save(os.path.join(OUTPUT_DIR, room.key))
    sprites, xys = extract_sprites(sprite_canvas, smile_id)
    for s, xy in zip(sprites, xys):
      sprite, new = matcher.get_or_create_from_image(s, 'plm')
      room.data['plm_sprites'].append([sprite.id, [round(i / 16) for i in xy]])
      if sprite.type in template_sprites:
        if 'plm' not in room.data:
          room.data['plm_overrides'] = {}
        x , y = [round(i / 16) for i in xy]
        room.data['plm_overrides'][f'{x},{y}'] = sprite.type
      if new:
        print("new sprite", sprite)
    room.save()

if __name__ == "__main__":
  main()
