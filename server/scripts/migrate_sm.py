# this script is meant to be run once when the vanilla-sm branch is deployed
import _setup

from maptroid.models import Zone

for zone in Zone.objects.all():
    zone.data['world'].pop('xy', None)
    if not 'bounds' in zone.data['world']:
        zone.data['world']['bounds'] = [0, 0, 1, 1]
    if zone.world_id == 1:
        zone.normalize()
    zone.save()