import os
import django
import sys

sys.path.append('.')

os.environ['DJANGO_SETTINGS_MODULE'] = 'main.settings'
django.setup()

from maptroid.models import World

def get_world_from_argv():
    worlds = World.objects.all()
    for world in worlds:
        if world.slug in sys.argv:
            return world
    while True:
        for world in worlds:
            print(f"{world.id} - {world.slug}")
        world_id = input("Select a world: ")
        if World.objects.filter(id=world_id):
            return World.objects.get(id=world_id)
        print('bad choice, try again')

def get_world_zones_from_argv(exclude_hidden=False):
    world = get_world_from_argv()
    zones = world.zone_set.all()
    for i, s in enumerate(sys.argv):
        if s in ['-z', '--zones', '--zone']:
            zones = zones.filter(slug__in=sys.argv[i+1].split(','))
    if exclude_hidden:
        zones = zones.exclude(slug__startswith="ztrash-")
        zones = zones.exclude(slug__startswith="unknown-")
    return world, zones

def get_wzr(exclude_hidden=False):
    world = get_world_from_argv()
    zones = world.zone_set.all()
    rooms = world.room_set.all()
    for i, s in enumerate(sys.argv):
        if s in ['-z']:
            slugs = sys.argv[i+1].split(',')
            zones = zones.filter(slug__in=slugs)
            if not zones:
                raise ValueError(f"Unable to find zones matching {slugs}")
        if s in ['-r']:
            rooms = rooms.filter(id__in=sys.argv[i+1].split(','))
    if exclude_hidden:
        zones = zones.exclude(slug__startswith="ztrash-")
        zones = zones.exclude(slug__startswith="unknown-")
    if zones.count():
        rooms = rooms.filter(zone__in=zones)
    return world, zones, rooms