import _setup
from colour import Color
from PIL import Image, ImageDraw
import re
import sys

from maptroid.models import World

with open('../client/src/css/zone-colors.scss', 'r') as f:
    _text = f.read()

color_by_name = {}
color_by_zone = {}
splitter = '/* DO NOT CHANGE THIS LINE WITHOUT UPDATING 7-map-icon.py */'
for line in _text.split(splitter)[0].split('\n'):
    if not line.startswith('$'):
        continue
    line = re.sub('[; ]', '', line)
    name, color = line.split(':')
    color_by_name[name] = color

for line in _text.split(splitter)[1].split('\n'):
    if not line.startswith('  "'):
        continue
    line = re.sub('[; ",]', '', line)
    zone, color_name = line.split(':')
    color_by_zone[zone] = color_by_name[color_name]


def main(world):
    print("Processing", world, world.slug)
    scale = 4
    W, H = world.normalize()
    img = Image.new("RGB", ((W+2)*scale, (H+2)*scale))
    draw = ImageDraw.Draw(img)

    for zone in world.zone_set.all():
        if zone.slug.startswith('unknown') or zone.slug.startswith('ztrash') or zone.data.get('hidden'):
            continue
        zx, zy, _, _ = zone.data['world']['bounds']
        zone_slug = zone.slug.split("__")[0]
        if not zone_slug in color_by_zone:
            raise ValueError(f'Zone with slug {zone_slug} missing from color map')
        for room in zone.room_set.all():
            rx, ry, _, _ = room.data['zone']['bounds']
            fill = color_by_zone[zone_slug]
            def _pts2(points):
                return [
                    (int(zx + rx + x+1)*scale, int(zy + ry + y+1)*scale)
                    for x, y in points
                ]
            outline = None
            # outline = 'black'
            for geo in room.data['geometry']['outer']:
                shape = geo['exterior']
                draw.polygon(_pts2(shape), fill=fill, outline=outline)

                for shape in geo['interiors']:
                    draw.polygon(_pts2(shape), fill="#000000", outline=outline)

    img.save(f'.media/{world.slug}.png')

if __name__ == "__main__":
    if sys.argv[1] == 'all':
        worlds = World.objects.exclude(slug='metroid-dread')
    else:
        worlds = World.objects.filter(slug__in=sys.argv[1:])
    for world in worlds:
        main(world)