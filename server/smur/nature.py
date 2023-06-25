import sys
import os
import json
sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'natureRando'))

from loadout import Loadout
from item_data import all_items
import logicCasual
import logicExpert

sys.path.pop()

name_by_slug = {
    'bomb': 'Bombs',
    'spring-ball': 'Springball',
    'grappling-beam': 'Grapple Beam',
    'hi-jump-boots': 'HiJump',
    'spazer-beam': 'Spazer',
}

item_by_name = {}
item_by_slug = {}

skips = ['draygon', 'phantoon', 'kraid', 'ridley']

for name, item in all_items.items():
    slug = name.lower().replace(' ', '-')
    name_by_slug[slug] = name
    item_by_name[name] = item
    item_by_slug[slug] = item

def get_logic(slug):
    if slug == 'casual':
        return logicCasual
    return logicExpert
