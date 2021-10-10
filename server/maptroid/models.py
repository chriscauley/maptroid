from django.db import models

_choices = lambda l: zip(l,l)

class World(models.Model):
  name = models.CharField(max_length=128)
  slug = models.CharField(max_length=128)
  __str__ = lambda self: self.name

class Room(models.Model):
  world = models.ForeignKey(World, null=True, blank=True, on_delete=models.SET_NULL)
  name = models.CharField(max_length=128, null=True, blank=True)
  key = models.CharField(max_length=128, null=True, blank=True)
  sprite_ids = models.JSONField(default=list)
  __str__ = lambda self: f'{self.name or "unnamed"} - ({self.key})'

class Character(models.Model):
  letter = models.CharField(max_length=1, blank=True, default='')
  image = models.ImageField(upload_to="smile_characters")

class Sprite(models.Model):
  """
  A sprite from the smile imports used to match various blocks.
  """
  TYPES = _choices(['item', 'map', 'unknown'])
  layers = models.JSONField(default=list)
  worlds = models.ManyToManyField(World)
  name = models.CharField(max_length=32, null=True, blank=True)
  # TODO is dhash always a number? if so might be better as big int
  dhash = models.CharField(max_length=24)
  image = models.ImageField(upload_to="smile_sprites")
  type = models.CharField(max_length=16, choices=TYPES, default='unknown')

class Entity(models.Model):
  TYPES = _choices(['item', 'environment', 'enemy', 'door', 'station', 'unknown'])