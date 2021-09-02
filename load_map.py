#!/usr/bin/env python3
# https://github.com/openzoom/deepzoom.py/blob/master/examples/helloworld/helloworld-dzi.py
import sys
from PIL import Image

Image.MAX_IMAGE_PIXELS = 933120000

import deepzoom


# Specify your source image
SOURCE = sys.argv[1]
name = SOURCE.split('/')[-1].split('.')[0]

# Create Deep Zoom Image creator with weird parameters
creator = deepzoom.ImageCreator(
    tile_size=256,
    tile_overlap=2,
    tile_format="png",
    image_quality=0.8,
    resize_filter="bicubic",
)

# Create Deep Zoom image pyramid from source
creator.create(SOURCE, f"client/public/output/{name}.dzi")
