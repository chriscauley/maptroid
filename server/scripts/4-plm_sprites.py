from _setup import get_world_zones_from_argv
import os
from django.conf import settings
import numpy as np
import unrest_image as img

from maptroid.models import Room, SmileSprite, SpriteMatcher
from maptroid.utils import mkdir

template_sprites = SmileSprite.objects.filter(template=True).values_list('type', flat=True)

def extract_sprites(image):
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
  world, zones = get_world_zones_from_argv()
  OUTPUT_DIR = mkdir(settings.MEDIA_ROOT, f'smile_exports/{world.slug}/plm_enemies/{room.key}')

  # rooms = rooms.filter(id=19)
  matcher = SpriteMatcher()
  for zone in zones:
    for room in rooms:
      finalize_plm(room)
      path = os.path.join(OUTPUT_DIR, room.key)
      if not os.path.exists(plm_image):
        print("WARNING: unable to find plm_image for {room.key}")
        continue
      plm_image = cv2.imread(path, cv2.IMREAD_UNCHANGED)

      sprites, xys = extract_sprites(plm_image)
      for s, xy in zip(sprites, xys):
        sprite, new = matcher.get_or_create_from_image(s, 'plm')
        room.data['plm_sprites'].append([sprite.id, [round(i / 16) for i in xy]])
        if sprite.type in template_sprites:
          if 'plm_overrides' not in room.data:
            room.data['plm_overrides'] = {}
          x , y = [round(i / 16) for i in xy]
          room.data['plm_overrides'][f'{x},{y}'] = sprite.type
        if new:
          print("new sprite", sprite)
      room.save()

if __name__ == "__main__":
  main()
