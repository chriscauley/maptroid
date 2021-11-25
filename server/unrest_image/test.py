import imagehash
import os
from pathlib import Path

import unrest_image as img

def test_reversible_imagehash():
  f = os.path.join(Path(__file__).resolve().parent, 'dummy.png')
  image = img._coerce(f, 'pil')
  hash1 = imagehash.dhash(image)
  hash2 = img.int_to_imagehash(img.imagehash_to_int(hash1))
  assert(hash1 == hash2)


if __name__ == "__main__":
  test_reversible_imagehash()