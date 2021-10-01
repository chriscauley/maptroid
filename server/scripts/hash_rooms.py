import _setup

from django.core.files.base import ContentFile
import imagehash
from io import BytesIO
from PIL import Image
import sys

from maptroid.models import World, Sprite, Room

_sprite_cache = {}

def get_sprite(image, world, layer_key):
  dhash = imagehash.dhash(image)
  world_layer = f'{world.id},{layer_key}'
  if world_layer not in _sprite_cache:
    # This saves time by only checking the sprites worlds and layers if they change
    _sprite_cache[world_layer] = {}
  cache = _sprite_cache[world_layer]
  if dhash in cache:
    return cache[dhash]
  sprite = Sprite.objects.filter(dhash=dhash).first()
  if not sprite:
    print('creating sprite for', dhash)
    img_io = BytesIO()
    image.save(img_io, format='PNG')
    img_file = ContentFile(img_io.getvalue(), f'{dhash}.png')
    sprite = Sprite.objects.create(
      dhash=dhash,
      layers=[layer_key],
      image=img_file,
    )
  if layer_key not in sprite.layers:
    sprite.layers.append(layer_key)
    sprite.save()
  if not sprite.worlds.filter(id=world.id).exists():
    sprite.worlds.add(world)
    sprite.save()
  cache[dhash] = sprite
  return sprite

def analyze_image(fpath):
  *_, world_key, layer_key, room_key = fpath.split('/')
  world = World.objects.get(slug=world_key)
  room = Room.objects.get(key=room_key)
  image = Image.open(fpath)
  width, height = image.size
  W = width // 16
  H = height // 16
  sprite_ids = []
  for y in range(H):
    for x in range(W):
      cropped = image.crop((x * 16, y * 16, (x+1) * 16, (y+1) * 16))
      sprite = get_sprite(cropped, world, layer_key)

if __name__ == "__main__":
  analyze_image(sys.argv[1])