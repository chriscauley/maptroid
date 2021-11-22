import _setup
import sys
from maptroid.models import World

world = World.objects.get(slug=sys.argv[1])

for zone in world.zone_set.all().filter(name='Wrecked Ship'):
    rooms = zone.room_set.all()
    min_x = min([room.data['zone']['bounds'][0] for room in rooms])
    min_y = min([room.data['zone']['bounds'][1] for room in rooms])
    for room in rooms:
        room.data['zone']['bounds'][0] -= min_x
        room.data['zone']['bounds'][1] -= min_y
        room.save()