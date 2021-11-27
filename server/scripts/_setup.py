import os
import django
os.environ['DJANGO_SETTINGS_MODULE'] = 'main.settings'
django.setup()

import sys

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

def get_world_zones_from_argv():
    world = get_world_from_argv()
    zones = world.zone_set.all()
    filtered_zones = [z for z in zones if z.slug in sys.argv]
    return world, filtered_zones or zones