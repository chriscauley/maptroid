import os
import django
os.environ['DJANGO_SETTINGS_MODULE'] = 'main.settings'
django.setup()

from django.conf import settings
from maptroid.models import World, Room

SMILE_DIR = os.path.join(settings.BASE_DIR, '../static/smile_exports/')
ROOM_SLICES = ['plm_enemies', 'layer-1', 'bts', 'layer-2']

for world_slug in os.listdir(SMILE_DIR):
  name = world_slug.replace('_', ' ').title()
  world, new = World.objects.get_or_create(name=name, slug=world_slug)
  if new:
    print(f'New World: {world}')
  world_dir = os.path.join(SMILE_DIR, world_slug)
  os.listdir(world_dir)

  keys = []
  for room_slice in ROOM_SLICES:
    keys += os.listdir(os.path.join(world_dir, room_slice))

  keys = list(set(keys))
  print('\n\n', world)
  for key in keys:
    missing = []
    for room_slice in ROOM_SLICES:
      if not os.path.exists(os.path.join(world_dir, room_slice, key)):
        missing.push(room_slice)
    if missing:
      print(f'{key} missing in: {missing}')