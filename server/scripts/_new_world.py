import _setup
from django.utils.text import slugify

from maptroid.models import Zone, World

NAME = 'Hyper Metroid'

ZONE_NAMES = ['Crateria', 'Brinstar', 'Norfair', 'Wrecked Ship', 'Maridia', 'Tourian']

# ZONE_NAMES = ['Atlantis Ship', 'Atlantis Water', 'Chozo Ruins', 'Lower Mines', 'Research Lab', 'Upper Mines']

ZONE_NAMES.append('unknown-'+slugify(NAME))
ZONE_NAMES.append('ztrash-'+slugify(NAME))

world, new = World.objects.get_or_create(name=NAME)
if not new:
  raise ValueError("World exists", world)

print("New world", NAME)
world.hidden = True
world.data['clear_holes'] = True
world.save()

for zone_name in ZONE_NAMES:
  zone, new = Zone.objects.get_or_create(world=world, name=zone_name)
  if new:
    print("New zone", zone)
  else:
    print("Zone exists", zone)
