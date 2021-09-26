from django.db import models

class World(models.Model):
  name = models.CharField(max_length=128)
  slug = models.CharField(max_length=128)
  __str__ = lambda self: self.name

class Room(models.Model):
  world = models.ForeignKey(World, null=True, blank=True, on_delete=models.SET_NULL)
  name = models.CharField(max_length=128)
  key = models.CharField(max_length=128)
  __str__ = lambda self: f'{self.name or "unnamed"} - ({self.key})'
