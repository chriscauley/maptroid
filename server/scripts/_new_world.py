import _setup
from django.utils.text import slugify

from maptroid.models import Zone, World

NAME = 'Kaizo'

ZONE_NAMES = ['Crateria', 'Brinstar', 'Norfair', 'Maridia', 'Wrecked Ship', 'Maridia', 'Tourian']

ZONE_NAMES = ['Chozo Ruins', 'Upper Mines', 'Lower Mines', 'Atlantis Ship', 'Atlantis Water', 'Research Lab']

ZONE_NAMES.append('unknown-'+slugify(NAME))
ZONE_NAMES.append('ztrash-'+slugify(NAME))

world, new = World.objects.get_or_create(name=NAME)
if new:
  print("New world", NAME)
else:
  raise ValueError("World exists", world)

for zone_name in ZONE_NAMES:
  zone, new = Zone.objects.get_or_create(world=world, name=zone_name)
  if new:
    print("New zone", zone)
  else:
    print("Zone exists", zone)