import _setup
import numpy as np
import time


def xys_to_np(xys):
    W = max([xy[0] for xy in xys])+1
    H = max([xy[1] for xy in xys])+1
    array = np.zeros((H, W), dtype=np.uint8)
    for x, y in xys:
        array[y,x] = 1
    return array


def find_max_rect(array):
    max_area = 0
    max_bounds = None
    H, W = array.shape
    for y in range(H):
        for x in range(W):
            if not array[y, x]:
                continue
            for h in range(1, H - y+1):
                for w in range(1, W - x+1):
                    area = w * h
                    if area != np.sum(array[y:y+h,x:x+w]):
                        break
                    if area > max_area:
                        max_area = area
                        max_bounds = [x, y, w, h]
    return max_bounds


def find_rectangles(array):
    rects = []
    while np.sum(array):
        rect = find_max_rect(array)
        rects.append(rect)
        x, y, w, h = rect
        array[y:y+h,x:x+w] = 0
    return rects


def xys_to_rectangles(xys):
    offset, xys = remove_offset(xys)
    array = xys_to_np(xys)
    rects = find_rectangles(array)
    return add_offset(rects, offset)


def remove_offset(xys):
    # xys can be any sized array like [x, y, ...]
    min_x = min([xy[0] for xy in xys])
    min_y = min([xy[1] for xy in xys])
    return (min_x, min_y), [[x - min_x, y - min_y, *rest] for x, y, *rest in xys]


def add_offset(xys, offset):
    # xys can be any sized array like [x, y, ...]
    min_x, min_y = offset
    return [[x + min_x, y + min_y, *rest] for x, y, *rest in xys]


# These string functions aren't necessary, but really useful when debugging
def string_to_xys(string):
    lines = string.strip('\n').split('\n')
    xys = []
    for y, line in enumerate(lines):
        for x, value in enumerate(line):
            if value == '1':
                xys.append([x, y])
    return xys


# ibid
def string_to_np(string):
    xys = string_to_xys(string)
    w = max([xy[0] for xy in xys])
    xys += [[w+1 + x,y] for x,y in xys]
    return xys_to_np(xys)


# ibid
def np_to_string(array):
    alpha = 'abcdefghijklmnopqrstuvwxyz'
    _chars = ' 123456789' + alpha + alpha.upper()
    return '\n'.join([
        ''.join([str(_chars[i%len(_chars)]) for i in line]).rstrip()
        for line in array
    ])


# ibid
def rects_to_string(rects):
    W = max([x+w for x, y, w, h in rects])
    H = max([y+h for x, y, w, h in rects])
    array = np.zeros((H, W), dtype=np.uint8)
    for i, (x, y, w, h) in enumerate(rects):
        for dx in range(w):
            for dy in range(h):
                array[y+dy,x+dx] = i + 1
    return np_to_string(array)
