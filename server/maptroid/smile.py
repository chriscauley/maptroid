# Automates taking screenshots of smile

import _setup

from collections import defaultdict
import cv2
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
from maptroid.utils import get_winderz, CRES, CRE_COLORS, dhash

BG_COLOR = (255, 128, 128)

LAYER = sys.argv[2]
SYNC_DIR = '../../_maptroid-sink'
assert(Path(SYNC_DIR).exists())

MAX_IMAGES = 0
FILTER_ROOMS = []
SKIP = 0


class WaitError(Exception):
    pass


def paste_to_channel(bg, fg, color):
    bg2 = bg.copy()
    bg2[:] = 0
    gray = cv2.cvtColor(fg, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)
    bg2[mask == 255] = color
    return cv2.addWeighted(bg, 1, bg2, 0.5, 0)


class BaseScreen:
    def __init__(self, world_slug):
        self.world_slug = world_slug
        self.sct = mss()
        self._prompt = None
        self.stats = defaultdict(list)

        self.data = get_winderz(world_slug)

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
            self.data['coords'][key] = urcv.input.get_exact_roi(
                lambda: self.grab(),
                f"Select coords for {key}",
            )
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
        ocr.normalize_colors(current)
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

class SmileScreen(BaseScreen):
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
        self.click('room_key')
        # go off and on room once to reset event_name if script started on first room
        pyautogui.press('down')
        pyautogui.press('up')
        pyautogui.press('up')
        time.sleep(0.5)
        print('first room', self.get_smile_id())
        self.click_neutral()

    def move_dropdown(self, key, direction):
        text = self.get_text(key)
        self.click_neutral()
        self.click(key)
        pyautogui.press(direction)
        def text_changed():
            try:
                new_text = self.get_text(key)
                return text != new_text
            except (ocr.UnknownLettersError, ocr.EmptyTextError):
                # sometimes it takes catches the text in mid-render
                # If it fails once wait and try again
                time.sleep(0.2)
                new_text = self.get_text(key)
                return text != new_text
        try:
            self.sleep_until(text_changed)
            time.sleep(0.5)
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

    def get_text(self, key):
        def text_is_readable():
            try:
                image = self.get_image(key)
                return ocr.read_text(image, interactive=True).upper()
            except (ocr.UnknownLettersError, ocr.EmptyTextError) as e:
                # sometimes it takes catches the text in mid-render
                # If it fails once wait and try again
                return False
        return self.sleep_until(text_is_readable)

    def get_smile_id(self):
        try:
            return self.get_text('room_key')
        except:
            # sometimes it takes catches the text in mid-render
            # If it fails once wait and try again
            time.sleep(0.1)
            return self.get_text('room_key')

    def get_event_name(self):
        EVENT_SUBSTITUTIONS = {
            'E652=MORPH&MIS': 'E652=MORPH&MISSI',
            'E669=POWERBOMBS': 'E669=POWERBOMBS1',
            'E5FF=TOURIANBOS': 'E5FF=TOURIANBOSS',
        }
        text = self.get_text('event_name')
        if text in EVENT_SUBSTITUTIONS:
            text = EVENT_SUBSTITUTIONS[text]
        events = self.list_events()
        if text in events:
            return text
        for target in events:
            if target.startswith(text):
                print(f'Warning, substituted event_name "{text}" => "{target}"')
                return target
        smile_id = self.get_smile_id()
        raise ValueError(f'Unable to find event: {text} not in {events} for room {smile_id}')

    def sleep_until(self, f, max_wait=5):
        waited = 0
        dt = 0.01
        name = f.__name__
        while True:
            if waited > max_wait:
                raise WaitError(f"Waited to long for {name}")
            value = f()
            if value:
                break
            time.sleep(dt)
            waited += dt
        self.stats['sleep_until__'+name].append(waited)
        return value

    def get_dest_path(self, smile_id, event_name):
        s = self.world_slug
        _dir = Path(f"{SYNC_DIR}/{s}/{LAYER}/{event_name}/")
        if not _dir.exists():
            print(f"making directory: {_dir}")
            _dir.mkdir(parents=True)
        return str(_dir / f"{s}_{smile_id}.png")


    def list_events(self):
        smile_id = self.get_smile_id()
        if smile_id not in self.data['room_events']:
            print('got events', smile_id)
            self.click_neutral()
            self.click('event_name')
            def event_options_appears():
                image = self.get_image('event_options')
                return (image == ocr.DROPDOWN_BLUE).all(2).any()
            self.sleep_until(event_options_appears)
            event_options = self.get_image('event_options')

            # remove everything after bottom dotted line
            y_stop = len(event_options) -1
            while not (event_options[y_stop][0] == ocr.DROPDOWN_BLUE).all():
                y_stop -= 1
            event_options = event_options[:y_stop]

            event_options = np.vstack([event_options, event_options[-1:]])
            values = []
            images, _coords = ocr.vsplit(event_options, ocr.DROPDOWN_GREEN)
            for image in images:
                values.append(ocr.read_text(image, interactive=True).upper())
            self.data['room_events'][smile_id] = values
            self.data._save()
        return self.data['room_events'][smile_id]

    def get_current_cre(self):
        for current_cre in CRES:
            if self.confirm('cre-text', current_cre):
                return current_cre

    def goto_cre(self, target_cre):
        current_cre = self.get_current_cre()
        if not current_cre:
            raise ValueError("Unknown CRE")
        current_index = CRES.index(current_cre)
        target_index = CRES.index(target_cre)
        delta_index = current_index - target_index
        direction = 'up-cre' if delta_index < 0 else 'down-cre'
        for i in range(abs(delta_index)):
            self.click(direction)
        def cre_matches():
            return self.get_current_cre() == target_cre
        self.sleep_until(cre_matches)

    def capture_cre(self):
        if not self.confirm('show-type-on-map', 'is-checked'):
            raise Exception("Please check show type on map")

        for i in range(15):
            self.click('down-cre')
        canvas = rb_trim(self.get_image('workarea'))
        canvas[:,:,:3] = 0
        cre_canvases = []
        for cre in CRES:
            self.goto_cre(cre)

            # click this twice to refresh cre tiles
            self.click('show-type-on-map')
            self.click('show-type-on-map')
            time.sleep(0.2)

            cre_canvas = rb_trim(self.get_image('workarea'))
            canvas = paste_to_channel(canvas, cre_canvas, CRE_COLORS[cre])
        return canvas
