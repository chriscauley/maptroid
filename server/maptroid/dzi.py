#!/usr/bin/env python3
# https://github.com/openzoom/deepzoom.py/blob/master/examples/helloworld/helloworld-dzi.py
import deepzoom
import os
from PIL import Image
import sys

Image.MAX_IMAGE_PIXELS = 933120000

def png_to_dzi(source):
    directory, fname = source.rsplit('/', 1)
    name = fname.split('.')[0]

    # deepzoom tries to write to / if you're not in same directory as target
    cwd = os.getcwd()
    os.chdir(directory)

    # Create Deep Zoom Image creator with weird parameters
    creator = deepzoom.ImageCreator(
        tile_size=256,
        tile_overlap=2,
        tile_format="png",
        image_quality=0.8,
        resize_filter="bicubic",
    )

    # Create Deep Zoom image pyramid from source
    creator.create(fname, f"{name}.dzi")
    os.chdir(cwd)
    return os.path.join(directory, f"{name}.dzi")