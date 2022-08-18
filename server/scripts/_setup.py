import django
import requests
import os
import sys

sys.path.append('.')

os.environ['DJANGO_SETTINGS_MODULE'] = 'main.settings'
django.setup()

from maptroid.models import World

def get_world_from_argv():
    worlds = World.objects.all()
    if len(sys.argv) > 1:
        return World.objects.get(slug=sys.argv[1])
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
                print([z.slug for z in world.zone_set.all()])
                raise ValueError(f"Unable to find zones matching {slugs}")
        if s in ['-r']:
            rooms = rooms.filter(id__in=sys.argv[i+1].split(','))
    if exclude_hidden:
        zones = zones.exclude(slug__startswith="ztrash-")
        zones = zones.exclude(slug__startswith="unknown-")
    if zones.count():
        rooms = rooms.filter(zone__in=zones)
    return world, zones, rooms

cache_dir = '../_cache'

def curl(url, force=False):
    file_path = os.path.join(cache_dir, url.split('/')[-1])
    if force or not os.path.exists(os.path.join(cache_dir, file_path)):
        with open(file_path, 'w') as f:
            response = requests.get(url)
            response.raise_for_status()
            f.write(response.text)
            print('curl downloaded', url)
    with open(file_path, 'r') as f:
        return f.read()
