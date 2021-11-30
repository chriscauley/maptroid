# adapted from https://stackoverflow.com/a/30418912/266564

import numpy

def max_rect(array):
    nrows, ncols = array.shape
    skip = 0
    area_max = (0, [])

    w = numpy.zeros(dtype=int, shape=array.shape)
    h = numpy.zeros(dtype=int, shape=array.shape)
    for r in range(nrows):
        for c in range(ncols):
            if array[r][c] == skip:
                continue
            if r == 0:
                h[r][c] = 1
            else:
                h[r][c] = h[r-1][c]+1
            if c == 0:
                w[r][c] = 1
            else:
                w[r][c] = w[r][c-1]+1
            minw = w[r][c]
            for dh in range(h[r][c]):
                minw = min(minw, w[r-dh][c])
                area = (dh+1)*minw
                if area > area_max[0]:
                    area_max = (area, [(r-dh, c-minw+1, r, c)])

    if not area_max[1]:
        return [0, 0, 0, 0,]

    y1, x1, y2, x2 = area_max[1][0]
    return [min(x1, x2), min(y1, y2), abs(x2-x1)+1, abs(y2-y1)+1]

if __name__ == "__main__":
    s = '''
1 1 1 1 0 1
1 1 0 1 1 0
1 1 1 1 1 1
0 1 1 1 1 1
1 1 1 1 1 0
1 1 1 0 1 1'''
    nrows = 6
    ncols = 6
    array = numpy.fromstring(s, dtype=int, sep=' ').reshape(nrows, ncols)
    x, y, w, h = max_rect(array)
    print(x, y, w, h)
    assert(x == 1)
    assert(y == 2)
    assert(w == 4)
    assert(h == 3)