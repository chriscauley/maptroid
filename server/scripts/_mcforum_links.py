import _setup
from maptroid.models import World

worlds = World.objects.exclude(hidden=True).order_by('name')
print(worlds.count())
for w in worlds:
    print(f'[url=https://maptroid.unrest.io/maps/{w.slug}/]{w.name}[/url]')