import _setup

import requests
from bs4 import BeautifulSoup
import os

from maptroid.models import Room, Zone
from maptroid.utils import mkdir

cache_dir = mkdir('..', '_cache')

zone_map = {
    'Blue Brinstar': 'Brinstar',
    # 'Ceres': '',
    # 'Crateria': '',
    'Green Brinstar': 'Brinstar',
    'Lower Norfair': 'Norfair',
    # 'Maridia': '',
    'Pink Brinstar': 'Brinstar',
    'Red Brinstar': 'Brinstar',
    # 'Tourian': '',
    'Upper Norfair': 'Norfair',
    'Warehouse': 'Brinstar',
    # 'Wrecked Ship': '',
}

def curl(url, force=False):
    file_path = os.path.join(cache_dir, url.split('/')[-1])
    if force or not os.path.exists(os.path.join(cache_dir, file_path)):
        with open(file_path, 'w') as f:
            response = requests.get(url)
            response.raise_for_status()
            f.write(response.text)
            print('curl downloaded', url)
    with open(file_path, 'r') as f:
        return f.read()

html = curl('https://wiki.supermetroid.run/List_of_rooms_by_SMILE_ID')
soup = BeautifulSoup(html, 'html.parser')

zone_names = []

def update_room(smile_id, zone_name, room_name, href):
    if not zone_name:
        return
    room = Room.objects.get(key=f"super_metroid_{smile_id}.png")
    zone = Zone.objects.get(name=zone_map.get(zone_name, zone_name))
    if room.zone and room.zone != zone:
        print('zone mismatch', smile_id, zoom.zone, zone)
    room.zone = zone
    room.name = room_name
    if href:
        room.data['wiki_link'] = href
    room.save()

# first row is column names
for row in soup.find_all('tr')[1:]:
    tds = row.find_all('td')
    smile_id, section, _, room_name, remarks = [td.text.strip() for td in tds]
    links = row.find_all('a')
    href = links[0]['href'] if len(links) == 1 else None
    if len(links) > 1:
        if not smile_id in ['7CF54', '7CF80']:
            raise NotImplementedError("Too many links: "+ smile_id)
    update_room(smile_id, section, room_name or remarks, href)
