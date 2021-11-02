import _setup

from maptroid.models import Zone, Screenshot

WORLD = 3
scale = 1280 / 17.855
VERSION = '1.0.0'

for zone in Zone.objects.all():
    for screenshot in zone.screenshot_set.filter(world_id=WORLD):
        if not '_world' in screenshot.data:
            print('no world data for screenshot', screenshot.id, zone.name)
            continue
        _world = screenshot.data['_world']
        screenshot.data.pop(f'world_{WORLD}', None)
        screenshot.data.pop('world', None)
        screenshot.data['zone'] = _world
        # screenshot.data['zone'] = {
        #     'xy': [i * scale for i in _world['xy']],
        #     'raw_xy': [i * scale for i in _world['raw_xy']],
        #     'group': _world.get('group', 0),
        #     'width': scale,
        #     'version': VERSION,
        # }
        screenshot.save()