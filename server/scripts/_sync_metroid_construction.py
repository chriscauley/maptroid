from _setup import curl
from bs4 import BeautifulSoup
from collections import defaultdict

from maptroid.models import World

keymap = [
    ('Author: ', 'author'),
    ('Average runtime:', 'runtime'),
    ('Genre:', 'genre'),
]

ahist = defaultdict(int)
ghist = defaultdict(int)

for world in World.objects.filter(mc_id__isnull=False):
    print('\n', world)
    html = curl(f'https://metroidconstruction.com/hack.php?id={world.mc_id}')
    soup = BeautifulSoup(html, 'html.parser')
    mc_data = world.data['mc_data'] = {}
    for div in soup.select('.underboxD'):
        text = div.text.strip()
        for string, key in keymap:
            if text.startswith(string):
                value = text.split(string)[-1]
                if key == 'genre':
                    value = value.split('[?]')[0] # genre help text
                if key == 'runtime':
                    value = value.split('Average')[0] # collection rate
                mc_data[key] = value.strip()

    ghist[mc_data.get('genre')] += 1
    ahist[mc_data.get('author')] += 1
    world.save()

print(ahist)
print(ghist)
