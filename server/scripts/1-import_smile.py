# creates the world and rooms from layer exports

import os
import django
os.environ['DJANGO_SETTINGS_MODULE'] = 'main.settings'
django.setup()

import typer
from django.conf import settings
from PIL import Image
import sys

from maptroid.models import World, Room

SMILE_DIR = os.path.join(settings.BASE_DIR, '../.media/smile_exports/')
ROOM_SLICES = ['layer-1', 'bts', 'layer-2']

app = typer.Typer()

def main(world_slug: str):
  world = World.objects.get(slug=world_slug)
  world_dir = os.path.join(SMILE_DIR, world_slug)
  os.listdir(world_dir)

  keys = []
  for room_slice in ROOM_SLICES:
    keys += os.listdir(os.path.join(world_dir, room_slice))

  keys = list(set(keys))
  print('\n\nAnalyzing world: ', world, len(keys), Room.objects.filter(world=world).count())
  for key in keys:
    if not key.endswith('png'):
      raise ValueError('Bad key:', key)
    missing = []
    for room_slice in ROOM_SLICES:
      if not os.path.exists(os.path.join(world_dir, room_slice, key)):
        missing.append(room_slice)
    if missing:
      print(f'{key} missing in: {missing}')
      continue
    room, new = Room.objects.get_or_create(key=key, world=world)
    if new or 'zone' not in room.data:
      print(f'New Room: {room}')
      width, height = Image.open(os.path.join(world_dir, 'layer-1', key)).size
      room.data['zone'] = {
        'bounds': [0, 0, width / 256, height / 256],
        'raw': [0, 0, width / 256, height / 256],
      }
      room.save()

if __name__ == "__main__":
  typer.run(main)