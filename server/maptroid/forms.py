from django.core.files.base import ContentFile
from django.conf import settings
from django import forms
import urllib
import os
from PIL import Image
from unrest import schema

from .models import World, Room, Screenshot, Zone

@schema.register
class WorldForm(forms.ModelForm):
  class Meta:
    model = World
    fields = ('name', 'slug')

@schema.register
class RoomForm(forms.ModelForm):
  class Meta:
    model = Room
    fields = ['name', 'key', 'world', 'zone', 'data']

@schema.register
class ScreenshotForm(forms.ModelForm):
  _original = None
  original = forms.CharField(required=False)

  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    if not self.data.get('original') == self.instance.original_url:
      self._original = self.data.get('original')

  def clean_original(self):
    if self._original:
      response = urllib.request.urlopen(self._original['dataURL'])
      self._original['file'] = ContentFile(response.read())

  def save(self, commit=True):
    instance = super().save(commit)
    if self._original:
      instance.original.save(self._original['name'], self._original['file'])
      instance.save()
    return instance

  class Meta:
    model = Screenshot
    fields = ['original', 'output', 'world', 'zone', 'data']

@schema.register
class ZoneForm(forms.ModelForm):
  class Meta:
    model = Zone
    fields = ['name', 'slug']