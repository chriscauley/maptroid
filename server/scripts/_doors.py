# Trying to figure out how to find doors in layer-1 and plm
from _setup import get_world_zones_from_argv
import cv2
import sys

from maptroid.doors import populate_room_doors, draw_doors, get_can_icons, get_halfcan_icons


if __name__ == "__main__":
    world, zones = get_world_zones_from_argv()
    can_icons = get_can_icons()
    layer_name = 'layer-1'
    if '-plm' in sys.argv:
        layer_name = 'plm_enemies'
    if '-half' in sys.argv:
        can_icons = get_halfcan_icons()
    for zone in zones:
        for room in zone.room_set.all():
            populate_room_doors(room)
            layer1 = cv2.imread(f'.media/smile_exports/{world.slug}/{layer_name}/{room.key}')
            result = draw_doors(layer1, room.data['doors'], cans=can_icons)
            cv2.imwrite(f'.media/trash/{room.key}', result)
