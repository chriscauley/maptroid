from django.conf import settings
from django.db import models
import imagehash
import os
import unrest_image as img

from maptroid.dread import process_screenshot

_choices = lambda l: zip(l,l)

class World(models.Model):
  name = models.CharField(max_length=128)
  slug = models.CharField(max_length=128)
  __str__ = lambda self: self.name


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

class Room(models.Model):
  world = models.ForeignKey(World, models.SET_NULL, null=True, blank=True)
  zone = models.ForeignKey(Zone, models.SET_NULL, null=True, blank=True)
  name = models.CharField(max_length=128, null=True, blank=True)
  key = models.CharField(max_length=128, null=True, blank=True)
  sprite_ids = models.JSONField(default=list, blank=True)
  data = models.JSONField(default=dict, blank=True)
  __str__ = lambda self: f'{self.name or "unnamed"} - ({self.key})'


def default_zone_data():
  return { 'world': { 'xy': [0,0] } }

class Item(models.Model):
  room = models.ForeignKey(Room, models.CASCADE)
  zone = models.ForeignKey(Zone, models.SET_NULL, null=True, blank=True)
  data = models.JSONField(default=default_zone_data, blank=True)

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


class SmileSprite(models.Model):
  """
  A sprite from the smile imports used to match various blocks.
  """
  name = models.CharField(max_length=32, null=True, blank=True)
  dhash = ImageHashField()
  average_color = models.JSONField()
  main_color = models.JSONField()
  image = models.ImageField(upload_to="smile_sprites")
  LAYERS = _choices(['bts', 'plm', 'tile', 'unknown'])
  layer = models.CharField(max_length=16, choices=LAYERS, default='unknown')
  type = models.CharField(max_length=32, blank=True, default='')

  def save(self, *args, **kwargs):
    if not self.dhash or self.average_color is None or self.main_color is None:
      self.reprocess()
    return super().save(*args, **kwargs)

  def reprocess(self):
    image = img._coerce(self.image.path, 'np')
    self.average_color = [round(i) for i in image.mean(axis=0).mean(axis=0)]
    self.dhash = imagehash.dhash(img._coerce(image, 'pil'))
    color_data = img.analyze_colors(image)
    self.average_color = [int(i) for i in color_data['average']]
    self.main_color = [int(i) for i in sorted(color_data['counts'].items(), key=lambda i: i[1])[-1][0]]
    self.save()

  @property
  def url(self):
    return self.image.url

  @property
  def binary_dhash(self):
    return bin(int(str(self.dhash), 16))[2:]


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
  data = models.JSONField(default=dict, blank=True)
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
