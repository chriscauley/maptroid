import cv2
from django.conf import settings
from maptroid.utils import mkdir
import numpy as np
import os
import re

STATIC_DIR = os.path.join(settings.BASE_DIR, '../static')
PX_PER_GRID = 16.5
cache = {}

def open_as_rgba(path):
    return cv2.cvtColor(cv2.imread(path), cv2.COLOR_RGB2RGBA)

def get_templates():
    if 'xy_templates' not in cache:
        # I pulled these edges from a screenshot
        x_template = open_as_rgba(os.path.join(STATIC_DIR, 'x_template.png'))
        y_template = open_as_rgba(os.path.join(STATIC_DIR, 'y_template.png'))
        cache['xy_templates'] = x_template, y_template
        print('cached templates')
    return cache['xy_templates']

def get_threshold():
    if 'threshold' not in cache:
        mask = open_as_rgba(os.path.join(STATIC_DIR, 'dread/mask.png'))
        ret, threshold = cv2.threshold(mask, 0, 255, cv2.THRESH_BINARY)
        for row in threshold:
            for pixel in row:
                if pixel [0] == 0:
                    pixel[3] = 0
        cache['threshold'] = threshold
        print('cached threshold')
    return cache['threshold']

def process_screenshot(screenshot):
    # Removes top and bottom ui text from screenshot
    # Shifts a screeshot to correct for xy drift. Deadspace is left as transparent pixels
    source_path = screenshot.original.path
    source_dir, fname = source_path.rsplit('/', 1)
    final_dir = mkdir(source_dir, 'output')
    final_path = os.path.join(final_dir, re.sub(r'.jpe?g$', '.png', fname))

    # Make temp dir(s) as needed
    TEMP_DIR = mkdir(settings.MEDIA_ROOT, 'temp', fname)

    def show(filename, img):
        cv2.imwrite(os.path.join(TEMP_DIR, filename+'.png'), img)

    x_template, y_template = get_templates()

    #load image into variable
    img_rgb = open_as_rgba(source_path)
    threshold = get_threshold()
    img_rgb[threshold==0] = 0
    img_rgb = img_rgb[150:570, 0:1280]
    show('masked', img_rgb)

    def locate(source_img, template_img, output_name=None):
        w, h = template_img.shape[0], template_img.shape[1]

        res = cv2.matchTemplate(source_img,template_img,cv2.TM_CCOEFF_NORMED)
        threshold = 0.9
        loc = np.where( res >= threshold)

        if output_name:
            output_img = source_img.copy()
            for pt in zip(*loc[::-1]):
                cv2.rectangle(output_img, pt, (pt[0] + w, pt[1] + h), (0,255,0), 2)
            show(output_name, output_img)
        return zip(*loc[::-1])

    def find_max_offset(coords):
        coords = coords or [0]
        mod_coords = [round(coord % PX_PER_GRID) for coord in coords]
        mod_hist = np.histogram(mod_coords, max(mod_coords) or 1)
        abs_hist = np.histogram(coords, max(coords) or 1)
        return list(mod_hist[0]).index(max(mod_hist[0]))

    def find_xy_shift(img_rgb):
        xs = locate(img_rgb, x_template, 'xmatch')
        ys = locate(img_rgb, y_template, 'ymatch')

        x_shift = find_max_offset([xy[0] for xy in xs])
        y_shift = find_max_offset([xy[1] for xy in ys])
        return x_shift, y_shift

    # shifting logic from https://stackoverflow.com/questions/19068085/shift-image-content-with-opencv
    def shift(img_rgb, xy_shift, output_name=None):
        shifted = img_rgb.copy()
        for i in range(shifted.shape[1] -1, shifted.shape[1] - xy_shift[0], -1):
            shifted = np.roll(shifted, -1, axis=1)
            shifted[:, -1] = 0


        for i in range(shifted.shape[0] -1, shifted.shape[0] - xy_shift[1], -1):
            shifted = np.roll(shifted, -1, axis=0)
            shifted[-1, :] = 0

        if output_name:
            show(output_name, shifted)
        return shifted

    if not 'human' in screenshot.data:
        screenshot.data['human'] = {}
    human = screenshot.data['human'] = {}
    ml = screenshot.data['ml'] = {}
    output = screenshot.data['output'] = {}

    ml['shift'] = find_xy_shift(img_rgb)
    output['shift'] = human.get('shift') or ml['shift']
    shifted = shift(img_rgb, output['shift'])

    cv2.imwrite(final_path, shifted)
    screenshot.output = final_path.split('.media/')[-1].strip('/')
    screenshot.save()
