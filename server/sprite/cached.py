import cv2
import functools

from sprite.models import MatchedSprite

@functools.lru_cache
def get_item_matcher():
    cache = {}
    for ms in MatchedSprite.objects.filter(category='item'):
        cache[ms.id] = ms.type
    return lambda id: cache.get(id)


def match_item(id):
    return get_item_matcher()(id)



@functools.lru_cache
def get_matchedsprite_image(id):
    obj = MatchedSprite.objects.get(id=id)
    return cv2.imread(obj.image.path, cv2.IMREAD_UNCHANGED)
