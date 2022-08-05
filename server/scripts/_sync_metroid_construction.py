from _setup import curl
from bs4 import BeautifulSoup
from collections import defaultdict

from maptroid.models import World

keymap = [
    ('Author: ', 'author'),
    ('Average runtime:', 'runtime'),
    ('Genre:', 'genre'),
    ('Rating:', 'rating'),
    ('Difficulty:', 'difficulty'),
]

ahist = defaultdict(int)
ghist = defaultdict(int)
warnings = []

def _clean(name):
    return name.lower().replace(' ', '')

for world in World.objects.filter(mc_id__isnull=False):
    print(f'\n{world}')
    html = curl(f'https://metroidconstruction.com/hack.php?id={world.mc_id}')
    soup = BeautifulSoup(html, 'html.parser')
    mc_data = world.data['mc_data'] = {}
    title = soup.title.string
    if not _clean(world.name) in _clean(title):
        warnings.append(f'Map name might not be correct "{world}" not in "{title}"')
    for div in soup.select('.underboxD'):
        text = div.text.strip()
        for string, key in keymap:
            if text.startswith(string):
                value = text.split(string)[-1]
                if key == 'genre' or key == 'difficulty':
                    value = value.split('[?]')[0] # genre help text
                if key == 'runtime':
                    value = value.split('Average')[0] # collection rate
                if key == 'rating':
                    text = str(div)
                    value = text.count('/star.png') + text.count('/half_star.png') / 2
                if isinstance(value, str):
                    value = value.strip()
                print(key, value)
                mc_data[key] = value

    ghist[mc_data.get('genre')] += 1
    ahist[mc_data.get('author')] += 1
    world.save()

for w in warnings:
    print(f"WARNING: {w}")
