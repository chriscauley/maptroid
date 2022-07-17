from django.conf import settings
from django.db import models
from django.utils.text import slugify
import imagehash
import numpy as np
import os
from unrest.decorators import cached_property
import unrest_image as img

from maptroid.shapes import get_room_walls, get_screens
from maptroid.dread import process_screenshot
from maptroid.utils import mkdir

_choices = lambda l: zip(l,l)

def default_world_data():
  return {
    'clear_holes': True,
    'elevators': [],
  }


DEV_ROOT = 'http://maptroid.uberfordogs.com:8943'

class World(models.Model):
  name = models.CharField(max_length=128)
  slug = models.CharField(max_length=128)
  hidden = models.BooleanField(default=False)
  data = models.JSONField(default=dict, blank=True)
  mc_id = models.IntegerField(null=True, blank=True)

  __str__ = lambda self: self.name

  def normalize(self):
    zones = self.zone_set.all()
    x_max = y_max = -1e20
    x_min = y_min = 1e20
    for zone in zones:
      if zone.data.get('hidden'):
        continue
      x, y, width, height = zone.data['world']['bounds']
      x_min = min(x, x_min)
      y_min = min(y, y_min)
      x_max = max(x + width, x_max)
      y_max = max(y + height, y_max)

    if zones and (x_min or y_min):
      for zone in zones:
        zone.data['world']['bounds'][0] -= x_min
        zone.data['world']['bounds'][1] -= y_min
        zone.save()
      for elevator in self.data.get('elevators', []):
        elevator['xys'] = [[x-x_min, y-y_min] for x,y in elevator['xys']]

      self.save()

  def save(self, *args, **kwargs):
    if not self.slug:
      self.slug = slugify(self.name)
    super().save(*args, **kwargs)


def default_data():
  return { 'world': { 'bounds': [0, 0, 1, 1] } }


class Zone(models.Model):
  class Meta:
    ordering = ('name',)
  __str__ = lambda self: self.name
  name = models.CharField(max_length=128)
  slug = models.CharField(max_length=128)
  world = models.ForeignKey(World, models.CASCADE)

  data = models.JSONField(default=default_data, blank=True)

  # TODO generalize these functions
  def get_image_path(self, ext='png'):
    return os.path.join(settings.MEDIA_ROOT, f'dread_zones/{self.id}-{self.slug}.{ext}')
  def get_image_url(self, ext='png'):
    return os.path.join(settings.MEDIA_URL, f'dread_zones/{self.id}-{self.slug}.{ext}')

  def normalize(self):
    rooms = self.room_set.all()
    if not rooms:
      return
    x_max = y_max = -1e20
    x_min = y_min = 1e20
    for room in rooms:
      x, y, width, height = room.data['zone']['bounds']
      x_min = min(x, x_min)
      y_min = min(y, y_min)
      x_max = max(x + width, x_max)
      y_max = max(y + height, y_max)

    if x_min or y_min:
      for room in rooms:
        room.data['zone']['bounds'][0] -= x_min
        room.data['zone']['bounds'][1] -= y_min
        room.save()

    self.data['world']['bounds'][2] = x_max - x_min
    self.data['world']['bounds'][3] = y_max - y_min
    self.save()

  def save(self, *args, **kwargs):
    if not self.slug:
      self.slug = slugify(self.name)
    super().save(*args, **kwargs)


class Room(models.Model):
  world = models.ForeignKey(World, models.SET_NULL, null=True, blank=True)
  zone = models.ForeignKey(Zone, models.SET_NULL, null=True, blank=True)
  name = models.CharField(max_length=128, null=True, blank=True)
  key = models.CharField(max_length=128, null=True, blank=True)
  sprite_ids = models.JSONField(default=list, blank=True)
  data = models.JSONField(default=dict, blank=True, encoder=img.NpEncoder)
  smile_data = models.JSONField(default=dict, blank=True, encoder=img.NpEncoder)
  __str__ = lambda self: f'{self.name or "unnamed"} - ({self.key})'

  def save(self, *args, **kwargs):
    # TODO needs default room data
    if not 'holes' in self.data:
      self.data['holes'] = []
    if not 'geometry' in self.data:
      self.data['geometry'] = {}
    if self.world_id != 3 and 'zone' in self.data: # TODO this doesn't work for dread yet
      self.data['geometry']['screens'] = get_screens(self)
      self.data['geometry']['outer'] = get_room_walls(self)
    super().save(*args, **kwargs)

  def get_dev_url(self):
    return f'{DEV_ROOT}/sm/{self.world.slug}/?room={self.id}'


class Item(models.Model):
  room = models.ForeignKey(Room, models.CASCADE)
  zone = models.ForeignKey(Zone, models.SET_NULL, null=True, blank=True)
  data = models.JSONField(default=dict, blank=True)
  __str__ = lambda self: str(self.data)


  def get_dev_url(self):
    return f'{DEV_ROOT}/sm/{self.room.world.slug}/?item={self.id}'

# class Door(models.Model):
#   room = models.ForeignKey(Room, models.CASCADE)
#   data = models.JSONField(default=dict, blank=True)
#   __str__ = lambda self: f'{self.room} {self.data}'

class Character(models.Model):
  letter = models.CharField(max_length=1, blank=True, default='')
  image = models.ImageField(upload_to="smile_characters")


class ImageHashField(models.CharField):
  def __init__(self, *args, **kwargs):
    kwargs['max_length'] = 24
    return super().__init__(*args, **kwargs)
  def get_db_prep_value(self, value, connection, prepared=False):
    if not value == None:
      return str(img.imagehash_to_int(value)) # idempotent for int
    return super().get_db_prep_value(value, connection, prepared)

  def from_db_value(self, value, expression, connection):
    if isinstance(value, str):
      value = img.int_to_imagehash(int(value, 16))
    return value

  def to_python(self, value):
    if isinstance(value, str):
      value = img.int_to_imagehash(int(value, 16))
    return value


colors = ['black', 'blue', 'eye', 'gold', 'gray', 'green', 'orange', 'pink', 'purple', 'red', 'white']

class SmileSprite(models.Model):
  """
  A sprite from the smile imports used to match various blocks.
  """
  image = models.ImageField(upload_to="smile_sprites")
  LAYERS = _choices(['bts', 'plm', 'tile', 'unknown'])
  layer = models.CharField(max_length=16, choices=LAYERS, default='unknown')
  type = models.CharField(max_length=32, blank=True, default='')
  MODIFIERS = _choices(['composite', 'inblock', 'inegg', 'respawn'])
  modifier = models.CharField(max_length=16, choices=MODIFIERS, null=True, blank=True)
  CATEGORIES = _choices(['block', 'geo', 'hex', 'item', 'enemy', 'obstacle', 'door', 'station', 'animation', 'trash'])
  category = models.CharField(max_length=16, choices=CATEGORIES, null=True, blank=True)
  COLORS = _choices(colors)
  color = models.CharField(max_length=16, choices=COLORS, null=True, blank=True)
  template = models.BooleanField(default=False)
  __str__ = lambda self: self.type or self.image.path.split('/')[-1]

  @property
  def url(self):
    return self.image.url

  @property
  def binary_dhash(self):
    return bin(int(str(self.dhash), 16))[2:]

  @cached_property
  def params(self):
    return SmileSprite.get_params(self.image.path)

  @staticmethod
  def get_params(image):
    nparray = img._coerce(image, 'np')
    color_data = img.analyze_colors(image)
    pil = img._coerce(image, 'pil')
    main_color = sorted(color_data['counts'].items(), key=lambda i: i[1])[-1][0]
    return {
      'average_color': [int(i) for i in color_data['average']],
      'main_color': [int(i) for i in main_color],
      'dhash': imagehash.dhash(pil),
      'size': pil.size,
    }

class SpriteMatcher():
  _cache = None
  def __init__(self):
    self._cache = list(SmileSprite.objects.all())
  def get_or_create_from_image(self, image, layer):
    new_params = SmileSprite.get_params(image)
    threshold = 8
    layer_sprites = [s for s in self._cache if s.layer == layer]
    if layer == 'bts':
      # bts has nearly identical sprites, unfortunately
      threshold = 1
    for sprite in layer_sprites:
      if sprite.params['size'] != new_params['size']:
        continue
      if sprite.params['dhash'] - new_params['dhash'] > threshold:
        continue
      _md = img.color_distance(new_params['main_color'], sprite.params['main_color'])
      if _md > threshold:
        continue
      _ad = img.color_distance(new_params['average_color'], sprite.params['average_color'])
      if _ad > threshold:
        continue

      # it's a match!
      if not np.array_equal(image, img._coerce(sprite.image.path, 'np')):
        print('duplicated!')
        duplicates_path = mkdir(settings.MEDIA_ROOT, f'smile_exports/plm_enemies/duplicates/{layer}')
        duplicate_path = os.path.join(duplicates_path, f'{sprite.id}.png')
        if os.path.exists(duplicate_path):
          dupe = img._coerce(duplicate_path, 'np')
        else:
          dupe = img._coerce(sprite.image.path, 'np')
        img._coerce(np.concatenate((dupe, image), axis=1), 'pil').save(duplicate_path)
      return sprite, False
    content_file = img.make_content_file(image, f'{hash(str(new_params))}.png')
    sprite = SmileSprite.objects.create(layer=layer, image=content_file)
    self._cache.append(sprite)
    return sprite, True

class Entity(models.Model):
  TYPES = _choices(['item', 'environment', 'enemy', 'door', 'station', 'unknown'])


class Screenshot(models.Model):
  world = models.ForeignKey(World, models.SET_NULL, null=True, blank=True)
  zone = models.ForeignKey(Zone, models.SET_NULL, null=True, blank=True)
  original = models.ImageField(upload_to="screenshots")
  output = models.ImageField(upload_to="output", null=True, blank=True)
  data = models.JSONField(default=dict, blank=True)

  @property
  def original_url(self):
    return self.original and self.original.url

  def save(self, *args, **kwargs):
    super().save(*args, **kwargs)
    if self.id and not self.output and self.original:
      process_screenshot(self)

  def reprocess(self):
    self.output = None
    self.save()


class Channel(models.Model):
  SOURCES = _choices(['youtube'])
  source = models.CharField(max_length=16, choices=SOURCES, default="youtube")
  external_id = models.CharField(max_length=24)
  name = models.CharField(max_length=30)
  icon = models.ImageField(upload_to="channel_icons")
  __str__ = lambda self: self.name


def default_video_data():
  return {
    'items': [],
    'room_xys': [],
  }


class Video(models.Model):
  class Meta:
    ordering = ('order',)
  SOURCES = _choices(['youtube'])
  source = models.CharField(max_length=16, choices=SOURCES, default="youtube")
  thumbnail = models.ImageField(upload_to="video_thumbnails")
  external_id = models.CharField(max_length=24)
  title = models.CharField(max_length=255)
  label = models.CharField(max_length=64)
  channel = models.ForeignKey(Channel, models.CASCADE)
  data = models.JSONField(default=default_video_data, blank=True)
  world = models.ForeignKey(World, models.CASCADE)
  order = models.IntegerField(default=0)
  __str__ = lambda self: self.title

  @property
  def channel_name(self):
    return self.channel.name

  @property
  def channel_icon(self):
    return self.channel.icon.url

  @property
  def thumbnail_url(self):
    return self.thumbnail.url


def default_run_data():
  return {
    'actions': [],
  }


class Run(models.Model):
  user = models.ForeignKey(settings.AUTH_USER_MODEL, models.CASCADE)
  data = models.JSONField(default=default_run_data, blank=True)
  world = models.ForeignKey(World, models.CASCADE)
