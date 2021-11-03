# This is a one off script for modifyingscreenshot, and zone data.
# Not a db migration because it doesn't really alter the schema in any way

import _setup

from maptroid.models import Zone, Screenshot

WORLD = 3
VERSION = '1.0.0'

for zone in Zone.objects.all():
    if not 'screenshot' in zone.data:
        zone.data = {
            'screenshot': {
                'width': 1280,
                'height': 430,
                'px_per_block': 17.855,
            }
        }
        zone.save()
    for screenshot in zone.screenshot_set.filter(world_id=WORLD):
        if not '_world' in screenshot.data:
            print('no world data for screenshot', screenshot.id, zone.name)
            continue
        _world = screenshot.data['_world']
        screenshot.data.pop(f'world_{WORLD}', None)
        screenshot.data.pop('world', None)
        screenshot.data['zone'] = _world
        screenshot.save()