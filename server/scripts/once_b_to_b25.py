import _setup

from maptroid.models import SmileSprite

"""
mod9
012
345
678

mod25
0 2 4 01234
      56789
a c e ....14
      ....19
k m o ....24
"""

mod25 ="0123456789abcdefghijklmno"

_map = {
    '0': '0',
    '1': '2',
    '2': '4',
    '3': 'a',
    '4': 'c',
    '5': 'e',
    '6': 'k',
    '7': 'm',
    '8': 'o',
}
def indexes_to_xys(indexes, mod):
    W = mod -1
    return [[(i%mod) / W, (i // mod) / W] for i in indexes]


def xys_to_indexes(xys, mod):
    W = mod - 1
    indexes = [W*(x + y * mod) for x, y in xys]
    for i in indexes:
        if i % 1:
            raise ValueError(f"xys made bad indexes\nxys: {xys}\nindexes:{indexes}")
    return [int(i) for i in indexes]


SmileSprite.objects.filter(type='b_0286').update(type='b25_04ok0')


for sprite in SmileSprite.objects.filter(type__startswith='b_'):
    if sprite.type == 'b_0286':
        continue
    sprite.type = 'b25_' + ''.join([_map[c] for c in sprite.type[2:]])
    sprite.save()



