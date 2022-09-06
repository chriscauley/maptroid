from django.conf import settings
import imagehash
import os
from PIL import Image
from unrest.utils import JsonCache

def mkdir(root, *args):
    parts = os.path.join(*args).strip('/').split('/')
    path = root
    if not os.path.exists(path):
        os.mkdir(path)
    for part in parts:
        path = os.path.join(path, part)
        if not os.path.exists(path):
            os.mkdir(path)
    return path

def get_winderz(world_slug):
    path = os.path.join(settings.SINK_DIR, f'smile_config/{world_slug}.json')
    return JsonCache(path, {
        'coords': {},
        'hashes': {},
        'colors': {},
        'room_events': {},
        'room_errors': {},
        'room_list': [],
    })

# These are used to generate the cre-extra values in smile_autoclicker
CRES = [
    'bomb',
    'grapple',
    'vertical',
    'shot',
    'crumble',
    'spike',
]

COLORS = [
    (255,0,0),
    (0,255,0),
    (0,0,255),
    (255,255,0),
    (255,0,255),
    (0,255,255),
]

CRE_COLORS = dict(zip(CRES,COLORS))

def ahash(image):
    image = Image.fromarray(image)
    return imagehash.average_hash(image)


def dhash(image):
    image = Image.fromarray(image)
    return imagehash.dhash(image)

def colorhash(image):
    image = Image.fromarray(image)
    return imagehash.colorhash(image)