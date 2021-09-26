from django.db import models

class World(models.Model):
  name = models.CharField(max_length=128)
  slug = models.CharField(max_length=128)

class Room(models.Model):
  world = models.ForeignKey(World)
  name = models.CharField(max_length=128)
  key = models.CharField(max_length=128)