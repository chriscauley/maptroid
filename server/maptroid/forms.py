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
    fields = ['name', 'key', 'world']

@schema.register
class ScreenshotForm(forms.ModelForm):
  _src = None
  src = forms.CharField(required=False)
  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    if not self.data.get('src') == self.instance.src:
      self._src = self.data.get('src')
  def clean_src(self):
    if self.data.get('world') != 3:
      raise NotImplementedError("This endpoint is only setup to work for metroid dread")
    if self._src:
      response = urllib.request.urlopen(self._src['dataURL'])
      source_path = os.path.join(settings.MEDIA_ROOT, 'dread/source', self._src['name'])
      crop_path = os.path.join(settings.MEDIA_ROOT, 'dread', self._src['name'])
      with open(source_path, 'wb') as f:
        f.write(response.file.read())
      xywh = (0, 140, 1280, 570)
      self._src['file'] = Image.open(source_path).crop(xywh).save(crop_path)
      return crop_path.split(settings.MEDIA_ROOT)[-1]

  # def save(self, commit=True):
  #   instance = super().save(commit)
  #   if self._src:
  #     instance.src.save(self._src['name'], self._src['file'])
  #     instance.save()
  #   return instance

  class Meta:
    model = Screenshot
    fields = ['src', 'world', 'zone', 'data']

@schema.register
class ZoneForm(forms.ModelForm):
  class Meta:
    model = Zone
    fields = ['name']