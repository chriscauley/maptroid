# Automates taking screenshots of smile

import _setup

from collections import defaultdict
import cv2
import imagehash
from maptroid.ocr import read_text, UnknownLettersError
from mss import mss
import numpy as np
from pathlib import Path
from PIL import Image
import pyautogui
import sys
import time
from unrest.utils import JsonCache
import urcv

BG_COLOR = (255, 128, 128)
WHITE = (255,255,255)
BLACK = (0, 0, 0)
DROPDOWN_GREEN = (0, 255, 0)
DROPDOWN_BLUE = (215, 120, 0)
DROPDOWN_ORANGE = (40, 135, 255)
DROPDOWN_GRAY = (100, 100, 100)
LAYER = 'plm_enemies'

MAX_ROOMS = 0
FILTER_ROOMS = []
SKIP = 0

def dhash(image):
    image = Image.fromarray(image)
    return imagehash.dhash(image)

class WaitError(Exception):
    pass

class ScreenChecker:
    def __init__(self, world_slug):
        self.world_slug = world_slug
        Path(f".media/winderz/{world_slug}").mkdir(exist_ok=True, parents=True)
        self.sct = mss()
        self._prompt = None
        self.stats = defaultdict(list)

        self.data = JsonCache(
            f".media/winderz/{world_slug}.json",
            {'coords': {},'hashes': {}, 'colors': {}}
        )
        screenshot = None

    def prompt(self, text):
        window_name = f'{self.world_slug} prompt'
        _prompt = np.zeros((100, 400), dtype=np.uint8)
        _prompt[:] = 0
        urcv.text.write(_prompt, text)
        cv2.imshow(window_name, _prompt)
        if not self._prompt:
            cv2.moveWindow(window_name, 1500, 1100)
        # cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 1)
        cv2.setWindowProperty(window_name,cv2.WND_PROP_FULLSCREEN,cv2.WINDOW_FULLSCREEN)
        cv2.setWindowProperty(window_name,cv2.WND_PROP_FULLSCREEN,cv2.WINDOW_NORMAL)
        self._prompt = True

    def grab(self, monitor=None):
        monitor = monitor or self.sct.monitors[1]
        return np.array(self.sct.grab(monitor))


    def get_coords(self, key):
        if not key in self.data['coords']:
            image = self.grab()
            self.data['coords'][key] = urcv.input.get_exact_roi(image, f"Select coords for {key}")
            self.data._save()
        return self.data['coords'][key]

    def get_image(self, key):
        x, y, w, h = self.get_coords(key)
        return self.grab({ 'top': y, 'left': x, 'width': w, 'height': h })[:,:,:3]

    def get_color(self, key):
        while key not in self.data['colors']:
            image = urcv.transform.crop(self.grab(), self.get_coords(key))
            cv2.imshow(f'get color {key}', image)
            pressed = urcv.wait_key()
            if pressed == 'y':
                self.data['colors'][key] = image[0][0].tolist()
        return self.data['colors'][key]

    def confirm(self, key, extra=None):
        current = self.get_image(key)
        hash_key = key
        if extra:
            hash_key += "__" + extra
        if not hash_key in self.data['hashes']:
            window_name = f'(c/r/q) {hash_key}'
            while True:
                cv2.imshow(window_name, current)
                pressed = urcv.wait_key()
                if pressed == 'q':
                    exit()
                elif pressed == 'c':
                    break
                current = self.get_image(key)
            cv2.destroyWindow(window_name)
            self.data['hashes'][hash_key] = str(dhash(current))
            self.data._save()
        return self.data['hashes'][hash_key] == str(dhash(current))

    def click(self, key):
        x, y, w, h = self.get_coords(key)
        pyautogui.click(x + w / 2, y + h / 2)


    def moveTo(self, key):
        x, y, w, h = self.get_coords(key)
        pyautogui.moveTo(x + w / 2, y + h / 2, 0.1)

class SmileScreenChecker(ScreenChecker):
    def goto_first_room(self):
        tries = 0
        while not self.confirm('room_key', 'first_room'):
            self.click('room_key')
            if tries:
                time.sleep(0.1)
            if tries > 4:
                raise NotImplementedError('unable to get to top')
            for i in range(10):
                time.sleep(0.1)
                pyautogui.press('pageup')
            self.click_neutral()
            tries += 1
        self.click_neutral()

    def goto_next_room(self):
        smile_id = self.get_smile_id()
        self.click_neutral()
        self.click('room_key')
        pyautogui.press('down')
        def smile_id_changed():
            return smile_id != self.get_smile_id()
        try:
            self.sleep_until(smile_id_changed)
            return True
        except WaitError:
            return False

    def click_neutral(self):
        self.click('neutral')

    def goto_workarea_top(self):
        while self.confirm('up_scroll', 'needs_scroll'):
            self.click('up_scroll')

    def goto_workarea_left(self):
        while self.confirm('left_scroll', 'needs_scroll'):
            self.click('left_scroll')

    def needs_scroll(self):
        workarea = self.get_image('workarea')
        return {
            'right': not all(workarea[0,-1] == BG_COLOR),
            'down': not all(workarea[-1,0] == BG_COLOR),
        }

    def get_dropdown(self, key):
        image = self.get_image(key)
        urcv.replace_color(image, DROPDOWN_ORANGE, DROPDOWN_GREEN)
        urcv.replace_color(image, DROPDOWN_BLUE, DROPDOWN_GREEN)
        urcv.replace_color(image, WHITE, BLACK)
        if image.shape[0] > 20:
            # multi row, split at gray
            image = split_on_color(image, DROPDOWN_GRAY)[0]

        return image

    def get_smile_id(self):
        try:
            smile_id = self.get_image('room_key')
            return read_text(smile_id).upper()
        except UnknownLettersError:
            time.sleep(0.1)
            smile_id = self.get_image('room_key')
            return read_text(smile_id).upper()

    def sleep_until(self, f, max_wait=10):
        waited = 0
        dt = 0.01
        name = f.__name__
        while True:
            if waited > max_wait:
                raise WaitError(f"Waited to long for {name}")
            if f():
                break
            time.sleep(dt)
            waited += dt
        self.stats['sleep_until__'+name].append(waited)
        print('waited', name, waited)

    def event_options_appears(self):
        return (self.get_dropdown('event_options') == DROPDOWN_GREEN).all(1).any()

    def get_dest_path(self, smile_id):
        s = self.world_slug
        return f".media/smile_exports/{s}/{LAYER}/{s}_{smile_id}.png"


def split_on_color(image, color):
    for y0 in range(image.shape[0]):
        if not (image[y0] == color).all():
            break
    for y in range(y0, image.shape[0]):
        if (image[y] == color).all():
            if y == 0:
                raise ValueError('wtf')
            return image[y0:y], image[y:]
    return image, None

def split_many_on_color(image, color):
    image = image.copy()
    results = []
    i = 0
    while True:
        i+= 1
        keep, remainder = split_on_color(image, color)
        results.append(keep)
        if i > 25:
            exit()
        if remainder is None or (remainder == color).all():
            break # remainder is purer color so get rid of it
        elif remainder.size and np.sum(remainder) > 0:
            image = remainder # repeat loop with remainder
        else:
            break
    return results

def rb_trim(image):
    bg_color = image[-1,-1]
    if np.sum(bg_color) == 0:
        return image
    while (image[-1] == bg_color).all():
        image = image[:-1]
        if not image.shape[0]:
            break
    while (image[:,-1] == bg_color).all():
        image = image[:,:-1]
        if not image.shape[1]:
            break
    return image


# TODO make a validation script that checks to make sure second to last image lines up properly with last image

def combine_screens(screens):
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
    return canvas

def count_events(screen):
    smile_id = screen.get_smile_id()
    screen.click_neutral()
    screen.click('event_name')
    screen.sleep_until(screen.event_options_appears)
    event_options = screen.get_dropdown('event_options')
    values = []
    for i, image in enumerate(split_many_on_color(event_options, DROPDOWN_GREEN)):
        values.append(read_text(image))
    return smile_id, values

def main(world_slug):
    [f.unlink() for f in Path('.media/trash/').glob("*") if f.is_file()]
    screen = SmileScreenChecker(world_slug)
    if not screen.confirm('amazon_titlebar'):
        pyautogui.click(50, 50)
        time.sleep(1)
    cv2.imwrite('.media/trash/az.png', screen.get_image('amazon_titlebar'))
    if not screen.confirm('amazon_titlebar'):
        raise Exception("Unable to find amazon")

    screen.goto_workarea_top()
    screen.goto_workarea_left()
    screen.moveTo('screen_00')

    room_count = 0
    screen.goto_first_room()
    for i in range(SKIP):
        screen.click('room_key')
        pyautogui.press('down')
    max_rooms = MAX_ROOMS or 500
    # count = 0
    while room_count < max_rooms:
        # try:
        #     smile_id, events = count_events(screen)
        # except UnknownLettersError:
        #     time.sleep(0.1)
        #     smile_id, events = count_events(screen)
        # count += len(events)
        image_written = capture_room(screen)
        if image_written:
            room_count += 1
        if not screen.goto_next_room():
            break

def capture_room(screen):
    smile_id = screen.get_smile_id()
    result_path = screen.get_dest_path(smile_id)
    if Path(result_path).exists():
        return
    screen.goto_workarea_top()
    screen.goto_workarea_left()

    if FILTER_ROOMS and smile_id not in FILTER_ROOMS:
        return
    event_name = screen.get_image('event_name')

    x = y = 0
    screens = {}
    def _capture(x, y):
        time.sleep(0.2)
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
    result = combine_screens(screens)
    if '--verify' in sys.argv:
        result2 = cv2.imread(result_path)
        if not np.array_equal(result, result2):
            cv2.imwrite(f'.media/trash/{smile_id}_old.png', result2)
            cv2.imwrite(f'.media/trash/{smile_id}_new.png', result)
            cv2.imwrite(f'.media/trash/{smile_id}_diff.png', diff_image(result, result2))
            print('image failed', smile_id)
    else:
        if LAYER == 'plm_enemies':
            # plm enemies is currently stored with alpha layer in it's raw form
            urcv.remove_color_alpha(result, [0, 0, 0])
        cv2.imwrite(result_path, result)
        return True

def diff_image(image1, image2):
    W = max(image1.shape[1], image2.shape[1])
    H = max(image1.shape[0], image2.shape[0])
    canvas1 = np.zeros((H, W, 3), dtype=np.uint8)
    urcv.draw.paste(canvas1, image1, 0, 0)
    canvas2 = np.zeros((H, W, 3), dtype=np.uint8)
    urcv.draw.paste(canvas2, image2, 0, 0)
    return cv2.add(cv2.subtract(canvas1, canvas2), cv2.subtract(canvas2, canvas1))

if __name__ == "__main__":
    main(sys.argv[1])
