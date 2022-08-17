# takes screenshots from ./media/smile_exports/WORLD/plm_enemies/batchNUMBER/
# crops, parses room_key/event_name, and assigns to room with best guess of position
from django.core.files.base import ContentFile
import imagehash
import json
import cv2
import numpy as np
import os
from unrest.utils import JsonCache
import random
import urcv
import tkinter as tk
from tkinter import simpledialog

from maptroid.utils import dhash

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
DROPDOWN_GREEN = (0, 255, 0)
DROPDOWN_BLUE = (215, 120, 0)
DROPDOWN_ORANGE = (40, 135, 255)
DROPDOWN_GRAY = (100, 100, 100)
DROPDOWN_BG_GRAY = (224,224,224)
DROPDOWN_TEXT_GRAY = (128,128,128)

hash_to_letter = JsonCache('./hash_to_letter.json')

class UnknownLettersError(Exception):
    pass

class EmptyTextError(Exception):
    pass


ROOT = tk.Tk()
def prompt(text):
    ROOT.withdraw()
    value = simpledialog.askstring(title="Test", prompt=text +" (cancel=exit,empty=error)")
    if value is None:
        exit()
    if len(value) == 0:
        raise UnknownLettersError("forced unknown")
    return value

def normalize_colors(image):
    urcv.replace_color(image, DROPDOWN_ORANGE, DROPDOWN_GREEN)
    urcv.replace_color(image, DROPDOWN_BLUE, DROPDOWN_GREEN)
    urcv.replace_color(image, DROPDOWN_BG_GRAY, DROPDOWN_GREEN)
    urcv.replace_color(image, DROPDOWN_TEXT_GRAY, BLACK)
    urcv.replace_color(image, WHITE, BLACK)
    urcv.replace_color(image, DROPDOWN_GREEN, WHITE)


def vtrim(image, color=None):
    y1 = 0
    y2 = image.shape[0] - 1
    while (image[y1] == color).all() and y1 < y2:
        y1 += 1
    while (image[y2] == color).all() and y1 < y2:
        y2 -= 1
    return image[y1:y2+1]


def htrim(image, color=None):
    x1 = 0
    x2 = image.shape[1] - 1
    while (image[:,x1] == color).all() and x1 < x2:
        x1 += 1
    while (image[:,x2] == color).all() and x1 < x2:
        x2 -= 1
    return image[:,x1:x2]


def vsplit(image, bg_color=None):
    cv2.imwrite(f'.trash/vsplit_start.png', image)
    if bg_color is None:
        bg_color = image[0][0]
    image = htrim(image, bg_color)
    start = 0
    stop = start
    split_rows = []
    coords = []
    height = image.shape[0]
    while start < height - 1:
        while (image[start] == bg_color).all() and start < height-1:
            start += 1
        stop = start
        while not (image[stop] == bg_color).all() and stop < height-1:
            stop += 1
        if start != stop:
            split_rows.append(image[start:stop])
            coords.append([start, stop])
        start = stop
    for i, img in enumerate(split_rows):
        cv2.imwrite(f'.trash/split_{i}.png', img)
    return split_rows, coords


def hsplit(image, bg_color=None):
    if bg_color is None:
        bg_color = image[0][0]
    image = vtrim(image, bg_color)
    start = 0
    stop = start
    split_letters = []
    coords = []
    width = image.shape[1]
    while start < width - 1:
        while (image[:, start] == bg_color).all() and start < width-1:
            start += 1
        stop = start
        while not (image[:, stop] == bg_color).all() and stop < width-1:
            stop += 1
        if start != stop:
            split_letters.append(image[:, start:stop])
            coords.append([start, stop])
        start = stop
    return split_letters, coords


def sep_stack(images):
    empty = images[0].copy()
    result = []
    for image in images:
        result.append(image)
        result.append(empty)
    return np.hstack(result)

def read_text(image, interactive=False):
    normalize_colors(image)
    letter_images, _coords = hsplit(image, bg_color=WHITE)
    cv2.imwrite('.media/trash/last_ocr.png', image)

    if not len(letter_images):
        path = f'./media/trash/empty_image.png'
        raise EmptyTextError('Image given was all background image')

    cv2.imwrite('.media/trash/last_stacked.png', sep_stack(letter_images))
    results = []
    unknown = False
    for letter_image in letter_images:
        hash_ = str(dhash(letter_image))
        if not hash_ in hash_to_letter:
            if interactive:
                window_name = f'text missing for hash{hash_}'
                cv2.imwrite('.media/trash/last_letter.png', letter_image)
                cv2.imshow(window_name, letter_image)
                cv2.setWindowProperty(window_name,cv2.WND_PROP_FULLSCREEN,cv2.WINDOW_FULLSCREEN)
                cv2.setWindowProperty(window_name,cv2.WND_PROP_FULLSCREEN,cv2.WINDOW_NORMAL)
                cv2.waitKey(200)
                value = prompt("What letter is being shown?")
                cv2.destroyWindow(window_name)
                hash_to_letter[hash_] = value
            else:
                if not hash_ in hash_to_letter['missing']:
                    path = f'.media/missing_hashes/{hash_}.png'
                    print('saving missing', path)
                    cv2.imwrite(path, letter_image)
                    hash_to_letter['missing'][hash_] = path
                    hash_to_letter._save()
                unknown = True
        results.append(hash_to_letter.get(hash_))

    if unknown:
        error = "Unknown letter(s) (see missing hashes directory)"
        raise UnknownLettersError(error)
    return ''.join(results)

def test():
    import cv2
    img = cv2.imread('.media/trash/az.png')
    print(read_text(img, interractive=True))
