#!/usr/bin/env python3
# https://github.com/openzoom/deepzoom.py/blob/master/examples/helloworld/helloworld-dzi.py


import os
from PIL import Image

Image.MAX_IMAGE_PIXELS = 933120000

import deepzoom

name = 'SuperMetroidMapZebes'

# Specify your source image
SOURCE = f"client/public/{name}.png"

# Create Deep Zoom Image creator with weird parameters
creator = deepzoom.ImageCreator(
    tile_size=256,
    tile_overlap=2,
    tile_format="png",
    image_quality=0.8,
    resize_filter="bicubic",
)

# Create Deep Zoom image pyramid from source
creator.create(SOURCE, "client/public/output/{name}.dzi")
