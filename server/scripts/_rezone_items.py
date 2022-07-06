from _setup import get_wzr

from maptroid.models import Item


for room in get_wzr()[2]:
    for item in room.item_set.all():
        item.zone = room.zone
        item.save()