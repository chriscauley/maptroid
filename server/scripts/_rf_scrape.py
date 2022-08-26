import _setup
import cv2
from django.utils.text import slugify
import json
import numpy as np
import os
import re
import sys
import time
import urcv


from maptroid import ocr
from maptroid.models import World, Room, Zone
from maptroid.smile import SmileScreen, WaitError

MAX = 0

RF_COORDS = {
    'width': [51, 89, 18, 13],
    'height': [51, 109, 18, 13],
    'map_x': [114, 89, 26, 13],
    'map_y': [114, 109, 26, 13],
    "room_name": [17, 23, 198, 13],
    'area': [78, 46, 125, 13],
}


def scrape_all_rooms(screen):
    import pyautogui

    screen.go_home()
    screen.click('rf_title')
    screen.confirm('rf_title')
    screen.get_text('rf_smile_id', interactive=True)
    screen.goto_first_room(image_key='rf_smile_id')
    time.sleep(1)

    i = 0
    max_rooms = MAX or 500
    while i < max_rooms:
        # some text fields are very slow to update which causes "half rendered letters"
        # sleeping 2 seconds seems to be enough

        i += 1
        screen.click('rf_roommdb')
        def room_key_is_closed():
            return not (screen.get_image('rf_room_header') == ocr.DROPDOWN_GREEN).all(2).any()
        screen.sleep_until(room_key_is_closed)
        last_room_header = screen.get_image('rf_room_header')
        # area = screen.get_text('rf_area', interactive=True, invert=True)
        # width = screen.get_text('rf_width', interactive=True, invert=True)
        # height = screen.get_text('rf_height', interactive=True, invert=True)
        # map_x = screen.get_text('rf_map_x', interactive=True, invert=True)
        # map_y = screen.get_text('rf_map_y', interactive=True, invert=True)
        smile_id = screen.get_text('rf_smile_id', interactive=True)

        cv2.imwrite(screen.get_dest_path(smile_id), last_room_header)
        screen.click('rf_smile_id')
        pyautogui.press('down')
        screen.click('rf_roommdb')
        def room_header_changed():
            if not room_key_is_closed():
                return False
            return (screen.get_image('rf_room_header') == last_room_header).any()
        screen.sleep_until(room_header_changed, max_wait=5)

        def smile_id_changed():
            return screen.get_text('rf_smile_id') != smile_id
        try:
            screen.sleep_until(smile_id_changed)
        except WaitError:
            print(f"ran out after {i} rooms")
            break
    print('done with scraping!')


def process_images(screen):
    results_path = screen.get_root_path('rf_scrape.json')

    # This loop was used to generate the coords
    for name in ['area', 'width', 'height', 'map_x', 'map_y', 'room_name']:
        if name not in RF_COORDS:
            first = cv2.imread(path)
            coords = urcv.input.get_exact_roi(first, name)
            RF_COORDS[name] = coords

    index = 0
    all_results = []
    fails = []
    for smile_id in screen.room_list:
        results = {}
        index += 1
        print(f'{index} / {len(screen.room_list)}')
        path = screen.get_dest_path(smile_id)
        img = cv2.imread(path)
        cv2.imshow('room info', img)
        scale = 4
        demo = urcv.transform.scale(img, scale)

        for name, coords in RF_COORDS.items():
            cropped = urcv.transform.crop(img, coords)
            if name == 'room_name':
                cropped = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
                cropped = cv2.threshold(cropped, 195, 255, cv2.THRESH_BINARY)[1]
                cropped = cv2.cvtColor(cropped, cv2.COLOR_GRAY2BGR)
            cropped = np.invert(cropped)
            urcv.replace_color(cropped, ocr.BLACK, ocr.DROPDOWN_GREEN)
            results[name] = ocr.read_text(cropped, interactive=True)

        if not smile_id in results['room_name']:
            fails.append([smile_id, results['room_name'], path])
            continue


        def hex2dec(s):
            return int(results[s].replace("$", ""),16)

        all_results.append([
            smile_id,
            hex2dec('map_x'),
            hex2dec('map_y'),
            hex2dec('width'),
            hex2dec('height'),
            results['area'],
        ])

        if not '--review' in sys.argv:
            continue
        for name, value in results.items():
            dest = RF_COORDS[name][:2]
            if name in ['width', 'height', 'map_x', 'map_y']:
                dest[0] -= 20
            if name == 'area':
                dest[1] += 20
            if name == 'room_name':
                dest[1] -= 10
            dest = [dest[0] *scale, dest[1]*scale]
            urcv.text.write(
                demo,
                results[name],
                pos=dest,
                bg_color=(255,255,255),
                color=(0,0,0),
            )
        cv2.imshow("demo", demo)

        urcv.wait_key()
    if fails:
        print("Failed images")
        for fail in fails:
            print(fail)

    with open(results_path, 'w') as f:
        f.write(json.dumps({
            'keys': ['smile_id', 'x', 'y', 'width', 'height', 'zone'],
            'rows': all_results,
        }))

def goc_zone(zone_name, world):
    zone_slug = slugify(zone_name)
    try:
        zone = Zone.objects.get(world=world, slug=zone_slug)
    except Zone.DoesNotExist:
        zone = Zone.objects.create(name=zone_name, slug=zone_slug, world=world)
        print("New Zone: ", zone)
    return zone

def main(world_slug):
    screen = SmileScreen(world_slug, layer='rf_scrape')
    missing = []
    for smile_id in screen.room_list:
        path = screen.get_dest_path(smile_id)
        if not os.path.exists(path):
            missing.append(path)

    if missing:
        print(missing[:10])
        print(f"need to scrape for missing {len(missing)} rooms (see above for first 10)")
        print("Press enter to continue or ctrl+c to quit")
        input()
        scrape_all_rooms(screen)

    results_path = screen.get_root_path('rf_scrape.json')
    process_images(screen)
    print('processed files into rf_scrape.json')

    try:
        world = World.objects.get(slug=world_slug)
    except World.DoesNotExist:
        name = world_slug.replace("-", " ").title()
        world = World.objects.create(name=name, slug=world_slug)
        print("New World: ", world)

    with open(results_path, 'r') as f:
        table = json.loads(f.read())

    zone_lookup = {}
    for row in table['rows']:
        data = dict(zip(table['keys'], row))
        room_key = f"{world_slug}_{data['smile_id']}.png"
        room = Room.objects.filter(key=room_key, world=world)
        if room:
            continue

        match = re.match(r'\$?(\d?\d?)(.*)', data['zone'])
        zone_number = match.group(1)
        zone_name = match.group(2) or f'zone {zone_number}'
        zone = goc_zone(zone_name, world)

        room = Room.objects.create(key=room_key, zone=zone, world=world)
        room.data['zone'] = {
            'bounds': [data['x'], data['y'], data['width'], data['height']],
            'raw': [0, 0, 0, 0],
        }
        room.save()
        print("New Room:", room.key,"in", zone, room.data['zone'])

    for k in ['ztrash-'+world_slug, 'unknown-'+world_slug]:
        z = goc_zone(k, world=world)
        z.data['hidden'] = True

if __name__ == '__main__':
    main(sys.argv[1])
