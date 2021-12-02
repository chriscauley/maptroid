from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union

def _square(x, y):
    return Polygon([
        [x, y],
        [x+1, y],
        [x+1, y+1],
        [x, y+1],
    ])

def get_room_shapes(room):
    _x, _y, width, height = room.data['zone']['bounds']
    if type(width) == float:
        print(room.name, width, height)
        room.data['zone']['bounds'] = [int(i) for i in room.data['zone']['bounds']]
        _x, _y, width, height = room.data['zone']['bounds']
    polygons = []
    for x in range(width):
        for y in range(height):
            holes = room.data.get('holes') or []
            if not [x, y] in holes:
                polygons.append(_square(x, y))
    multipolygon = unary_union(polygons)
    if isinstance(multipolygon, Polygon):
        multipolygon = MultiPolygon([multipolygon])
    return {
        'outer': [
            {
                'exterior': [list(p) for p in polygon.exterior.coords[:-1]],
                'interiors': [[list(p) for p in i.coords[:-1]] for i in polygon.interiors],
            }
            for polygon in multipolygon.geoms
        ]
    }

