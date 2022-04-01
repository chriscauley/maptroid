from _setup import get_world_zones_from_argv
from collections import defaultdict

rooms_by_height = defaultdict(list)

world, zones = get_world_zones_from_argv()

if len(zones) != 1:
    raise ValueError('you can only perform this on one zone at a time')

for room in zones[0].room_set.all():
    rooms_by_height[room.data['zone']['bounds'][3]].append(room)

y = 0
for height, rooms in sorted(list(rooms_by_height.items())):
    x = 0
    rooms = sorted(rooms, key=lambda r: r.data['zone']['bounds'][2])
    for room in rooms:
        if x > 30:
            x = 0
            y += height + 1
        room.data['zone']['bounds'][0] = x
        room.data['zone']['bounds'][1] = y
        room.save()
        x += room.data['zone']['bounds'][2] + 1
    y += height + 1

