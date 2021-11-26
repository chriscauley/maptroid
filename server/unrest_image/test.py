import imagehash
import numpy as np
import os
from PIL import Image
from pathlib import Path

import unrest_image as img

DUMMY = os.path.join(Path(__file__).resolve().parent, 'dummy.png')

def test_reversible_imagehash():
  image = img._coerce(DUMMY, 'pil')
  hash1 = imagehash.dhash(image)
  hash2 = img.int_to_imagehash(img.imagehash_to_int(hash1))
  assert(hash1 == hash2)


def test_analyze_colors():
  results = img.analyze_colors(DUMMY)
  pixels = 0
  totals = np.array([0, 0, 0])
  for row in img._coerce(DUMMY, 'np'):
    for color in row:
      if color[3] != 0:
        totals += color[:3]
        pixels += 1
  assert(all(np.round(np.array(totals) / pixels) == results['average']))
  top_color = sorted(results['counts'].items(), key=lambda i: i[1])[-1]
  assert(top_color == ((179, 0, 0, 255), 147))


if __name__ == "__main__":
  test_reversible_imagehash()
  test_analyze_colors()