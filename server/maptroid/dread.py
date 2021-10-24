import cv2
from django.conf import settings
import numpy as np
import os
import re

PX_PER_GRID = 8.25

def mkdir(root, *args):
    parts = os.path.join(*args).strip('/').split('/')
    path = root
    if not os.path.exists(path):
        os.mkdir(path)
    for part in parts:
        path = os.path.join(path, part)
        if not os.path.exists(path):
            os.mkdir(path)
    return path

def process_screenshot(screenshot):
    # Removes top and bottom ui text from screenshot
    # Shifts a screeshot to correct for xy drift. Deadspace is left as transparent pixels
    source_path = screenshot.original.path
    source_dir, fname = source_path.rsplit('/', 1)
    final_dir = mkdir(source_dir, 'output')
    final_path = os.path.join(final_dir, re.sub(r'.jpe?g$', '.png', fname))
    xywh = (0, 140, 1280, 570)

    # Make temp dir(s) as needed
    TEMP_DIR = mkdir(settings.MEDIA_ROOT, 'temp', fname)

    def show(filename, img):
        cv2.imwrite(os.path.join(TEMP_DIR, filename+'.png'), img)

    # I pulled these edges from a screenshot
    x_template = cv2.imread(os.path.join(settings.BASE_DIR, '../static/x_template.png'))
    y_template = cv2.imread(os.path.join(settings.BASE_DIR, '../static/y_template.png'))

    #load image into variable
    img_rgb = cv2.imread(source_path)[150:570, 0:1280]

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
        shifted = cv2.cvtColor(shifted, cv2.COLOR_RGB2RGBA)
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