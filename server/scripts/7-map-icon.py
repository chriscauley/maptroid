from _setup import get_wzr

from PIL import Image, ImageDraw

world, zones, _ = get_wzr(exclude_hidden=True)

scale = 16

W, H = world.normalize()

img = Image.new("RGB", ((W+2)*scale, (H+2)*scale))
draw = ImageDraw.Draw(img)
for zone in zones:
    zx, zy, _, _ = zone.data['world']['bounds']
    for room in zone.room_set.all():
        rx, ry, _, _ = room.data['zone']['bounds']
        color1 = (255, 0, 0)
        color2 = (128, 0, 0)
        black = (0, 0, 0)
        def _pts2(points):
            return [
                (int(zx + rx + x+1)*16, int(zy + ry + y+1)*16)
                for x, y in points
            ]
        for geo in room.data['geometry']['outer']:
            shape = geo['exterior']
            draw.polygon(_pts2(shape), fill="#880000", outline="#ff0000")

            for shape in geo['interiors']:
                draw.polygon(_pts2(shape), fill="#000000", outline="#ff0000")

img.save('.media/trash/map2.png')