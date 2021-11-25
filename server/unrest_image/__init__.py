from collections import defaultdict
from io import BytesIO
import imagehash
import numpy as np
import os
from PIL import Image
import urllib

def _get_format(img):
  if isinstance(np.ndarray):
    return "np"
  return "pil"

def _coerce(img, format_):
  if type(img) == str:
    if img.startswith('data:'):
      if format_ == 'dataurl':
        # currently the only way to output a dataurl is this idempotent action
        return format_
      with urllib.request.urlopen(img) as response:
        with open('/tmp/sprite.png', 'wb') as f:
          f.write(response.read())
        img = Image.open('/tmp/sprite.png')

    elif os.path.exists(img):
      img = Image.open(img)

  if format_ == "np":
    return np.array(img)

  if format_ == "pil":
    if isinstance(img, str):
      return Image.open(img)
    if isinstance(img, Image.Image):
      return img
    if isinstance(img, np.ndarray):
      mode = 'RGBA' if img.shape[-1] == 4 else 'RGB'
      return Image.fromarray(img, mode=mode)
    raise ValueError(f"Unknown image source of type: {type(img)}")

  raise ValueError(f"Unknown image format requested: {format_}")


def make_content_file(img, name):
  img = _coerce(img, "pil")
  img_io = BytesIO()
  img.save(img_io, format=name.split('.')[-1])
  return ContentFile(img_io.getvalue(), name)

def replace_color(image, color1, color2):
  format_ = get_format(img)
  array = _coerce_to_np(img)
  array[(array == color1).all(axis = -1)] = color2
  return _coerce(array, format_)


def get_or_create(image_name, function, path="", force=False):
  target_path = os.path.join(path, image_name)
  if not force and os.path.exists(target_path):
    return Image.open(target_path), False

  image = function()
  image.save(target_path)
  return image, True


# ideally we should do something more like this: https://stackoverflow.com/a/43111221/266564
def get_palette(img):
  img = _coerce(img, 'np')
  hist = defaultdict(int)
  ignore_alpha_0 = img.shape[2] == 4
  for row in img:
    for color in row:
      if ignore_alpha_0 and color[3] == 0:
        continue
      hist[tuple(color)] += 1
  return hist


def int_to_64bit_array(value):
  array = [int(i) for i in bin(value)[2:]]
  while len(array) < 64:
    array.insert(0, 0)
  return array


def int_to_imagehash(value):
  if isinstance(value, imagehash.ImageHash):
    return value
  hash_ = np.array(int_to_64bit_array(value)).reshape((8, 8))
  return imagehash.ImageHash(hash_)


def imagehash_to_int(value):
  if isinstance(value, int):
    return value
  res = 0
  for row in value.hash:
    for boolean in row:
      res = (res << 1) | int(boolean)
  return res
