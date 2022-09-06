from _setup import get_wzr
from collections import defaultdict

from maptroid.models import Item


for room in get_wzr()[2]:
    taken = defaultdict(list)
    for item in room.item_set.all().order_by('id'):
        xy = tuple(item.data['room_xy'])
        if xy in taken:
            if taken[xy].id > item.id:
                taken[xy].delete()
            else:
                item.delete()
                continue
        taken[xy] = item
        item.zone = room.zone
        item.save()
