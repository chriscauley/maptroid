# Automates taking screenshots of smile

import _setup

from collections import defaultdict
import cv2
from django.conf import settings
import imagehash
from mss import mss
import numpy as np
from pathlib import Path
from PIL import Image
import pyautogui
import sys
import time
import urcv

from maptroid import ocr
from maptroid.models import Room
from maptroid.smile import SmileScreen, WaitError, rb_trim
from maptroid.utils import get_winderz, CRES, CRE_COLORS, dhash

BG_COLOR = (255, 128, 128)

MAX_IMAGES = 0
FILTER_ROOMS = []


def paste_to_channel(bg, fg, color):
    bg2 = bg.copy()
    bg2[:] = 0
    gray = cv2.cvtColor(fg, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)
    bg2[mask == 255] = color
    return cv2.addWeighted(bg, 1, bg2, 0.5, 0)


# TODO make a validation script that checks to make sure second to last image lines up properly with last image

def combine_screens(screens, world_slug, smile_id):
    h, w = screens[(0,0)].shape[:2]
    x_max = 0
    y_max = 0
    for x, y in screens.keys():
        x_max = max(x_max, x)
        y_max = max(y_max, y)
    h = (int(h/256) + y_max) * 256
    w = (int(w/256) + x_max) * 256
    canvas = np.zeros((h,w,3), dtype=np.uint8)
    canvas[:, :] = BG_COLOR
    for (x, y), image in screens.items():
        dx = x * 256
        dy = y * 256
        if x_max and x == x_max:
            dx -= 64
        if y_max and y == y_max:
            dy -= 80
        urcv.draw.paste(canvas, image, dx, dy)
    canvas = rb_trim(canvas)

    # this is a checksum to verify image lined up properly
    for (x, y), image in screens.items():
        ih, iw = image.shape[:2]
        if x == x_max and y == y_max:
            continue
        dx = x * 256
        dy = y * 256

    room = Room.objects.filter(world__slug=world_slug, key=f'{world_slug}_{smile_id}.png').first()
    if room:
        _ , _, zw, zh = room.data['zone']['bounds']
        print(smile_id, zh*256, zw*256, 'vs', canvas.shape)
    return canvas

def get_targets(screen):
    targets = []
    for smile_id in screen.room_list:
        if smile_id not in screen.world_data['room_events']:
            targets.append(smile_id)
            continue
        for event_name in screen.world_data['room_events'][smile_id]:
            path = screen.get_dest_path(smile_id, event_name)
            if not Path(path).exists():
                targets.append(smile_id)
    return targets

def skip_to_next_target(screen, smile_id, targets):
    current_index = screen.room_list.index(smile_id)
    target_index = screen.room_list.index(targets[0])
    delta_index = target_index - current_index
    screen.click('room_key')
    print(f'skipping to {targets[0]} from {smile_id} by {target_index}-{ current_index}={delta_index}')
    if delta_index >= 7 and False:
        pyautogui.press('pagedown')
        time.sleep(0.1)
    elif delta_index > 0:
        for i in range(delta_index):
            pyautogui.press('down')
            time.sleep(0.2)
    else: # less than zero
        print("got ahead of self")
        for i in range(-delta_index):
            pyautogui.press('up')
        time.sleep(5)
    # time.sleep(1)

def main(world_slug, layer):
    [f.unlink() for f in Path('.media/trash/').glob("*") if f.is_file()]
    screen = SmileScreen(world_slug, layer)

    targets = get_targets(screen)
    screen.go_home()

    # TODO move all this into go home?
    screen.goto_workarea_top()
    screen.goto_workarea_left()
    time.sleep(2) # need to sleep after last down/up (should wait for smile_id to match first)
    screen.moveTo('screen_00')
    screen.goto_first_room()
    screen.show_layers(layer)

    image_count = 0

    max_images = MAX_IMAGES or 1000
    last_event_name = None
    current_index = 0

    while image_count < max_images:
        smile_id = screen.get_smile_id()

        if len(targets) == 0:
            print("targets is empty")
            break

        if smile_id not in targets:
            skip_to_next_target(screen, smile_id, targets)
            continue

        print('processing', smile_id)

        image_written = capture_room(screen)
        if image_written:
            image_count += 1
        events = screen.list_events(smile_id)
        event_name = screen.get_event_name()
        if event_name != events[0]:
            screen.click_neutral()
            screen.click('room_key')
            # TODO sleep until room_key is selected
            time.sleep(0.2)
            pyautogui.press('tab')
            pyautogui.press('up')
            def event_name_changes():
                event_name = screen.get_event_name()
                return event_name != last_event_name
            try:
                # event changing seems to take a while
                screen.sleep_until(event_name_changes)
                last_event_name = event_name
            except WaitError:
                screen.move_dropdown('room_key', 'down')
                print(f"FAIL: unable to get {smile_id} {event_name}")
                last_event_name = None
        elif screen.move_dropdown('room_key', 'down'):
            if targets is not None:
                targets.remove(smile_id)
                if len(targets) == 0:
                    print('final target')
                    break
        else:
            print("Stopped scrapping (no more rooms)")
            break
    print(f"finished scraping {image_count} images")

def capture_room(screen):
    smile_id = screen.get_smile_id()
    event_name = screen.get_event_name()
    result_path = screen.get_dest_path(smile_id, event_name)
    if Path(result_path).exists():
        return
    screen.goto_workarea_top()
    screen.goto_workarea_left()

    if FILTER_ROOMS and smile_id not in FILTER_ROOMS:
        return

    x = y = 0
    screens = {}
    def _capture(x, y):
        time.sleep(0.5)
        if screen.layer == 'bts-extra':
            workarea = screen.capture_cre()
        else:
            workarea = screen.get_image('workarea')
        screens[(x,y)] = workarea
    def capture_row():
        screen.goto_workarea_left()
        x = 0
        _capture(x, y)
        while screen.needs_scroll()['right']:
            screen.click_neutral()
            screen.click('right_scroll')
            x += 1
            _capture(x, y)
    screen.goto_workarea_top()
    while screen.needs_scroll()['down']:
        screen.click_neutral()
        capture_row()
        y += 1
        screen.click('down_scroll')
    if len(screens) == 0:
        if screen.needs_scroll()['right']:
            capture_row()
        else:
            _capture(0, 0)
    s = screen.world_slug
    result = combine_screens(screens, screen.world_slug, smile_id)
    if '--verify' in sys.argv:
        result2 = cv2.imread(result_path)
        if not np.array_equal(result, result2):
            cv2.imwrite(f'.media/trash/{smile_id}_old.png', result2)
            cv2.imwrite(f'.media/trash/{smile_id}_new.png', result)
            cv2.imwrite(f'.media/trash/{smile_id}_diff.png', diff_image(result, result2))
            print('image failed', smile_id)
    else:
        if screen.layer in 'plm_enemies':
            # plm enemies is currently stored with alpha layer in it's raw form
            result = cv2.cvtColor(result, cv2.COLOR_BGR2BGRA)
            urcv.remove_color_alpha(result, [0, 0, 0])
        cv2.imwrite(result_path, result)
        print('wrote', result_path)
        return True

def diff_image(image1, image2):
    W = max(image1.shape[1], image2.shape[1])
    H = max(image1.shape[0], image2.shape[0])
    canvas1 = np.zeros((H, W, 3), dtype=np.uint8)
    urcv.draw.paste(canvas1, image1, 0, 0)
    canvas2 = np.zeros((H, W, 3), dtype=np.uint8)
    urcv.draw.paste(canvas2, image2, 0, 0)
    return cv2.add(cv2.subtract(canvas1, canvas2), cv2.subtract(canvas2, canvas1))

def grab_all_layers(world_slug):
    images = []
    for layer in ['layer-1', 'layer-2', 'bts', 'plm_enemies', 'bts-extra']:
        print('starting layer:', layer)
        main(world_slug, layer)
        print('finished layer:', layer)

if __name__ == "__main__":
    if sys.argv[2] == 'all':
        grab_all_layers(sys.argv[1])
    else:
        main(sys.argv[1], sys.argv[2])

    time.sleep(1)
    with pyautogui.hold('alt'):
        pyautogui.press('tab')
        time.sleep(1)
        pyautogui.press('tab')
