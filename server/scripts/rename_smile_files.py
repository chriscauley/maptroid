from _setup import get_wzr
import os

from maptroid.models import Room

world, _, _ = get_wzr()

for d in ['_maptroid-sink', 'sm_cache']:
    ROOT = f'.media/{d}/{world.slug}'
    dirs = ['layer-1', 'layer-2', 'bts', 'plm_enemies', 'layer-2+layer-1']
    for _dir in dirs:
        _dir = os.path.join(ROOT, _dir)
        if not os.path.exists(_dir):
            continue
        files = [s for s in os.listdir(_dir) if s.endswith('.png') and s.startswith('super_metroid')]
        for f in files:
            src = os.path.join(_dir, f)
            dest = os.path.join(_dir, f.replace('super_metroid', world.slug))
            os.rename(src, dest)

for room in world.room_set.all():
    room.key = room.key.replace('super_metroid', world.slug)
    room.save()