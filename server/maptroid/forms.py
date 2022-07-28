from django.core.files.base import ContentFile
from django.conf import settings
from django.core.cache import cache
from django import forms
import urllib
import os
import unrest_schema

from .models import World, Room, Screenshot, Zone, Item, Video, SmileSprite, Run

@unrest_schema.register
class WorldForm(forms.ModelForm):
  user_can_GET = user_can_LIST = 'ALL'
  class Meta:
    model = World
    fields = ('name', 'slug', 'hidden', 'data', 'mc_id')

@unrest_schema.register
class RoomForm(forms.ModelForm):
  user_can_GET = user_can_LIST = 'ALL'
  filter_fields = ['zone__slug', 'world__slug'] # TODO use world__slug and remove zone__slug

  def get_list_cache(self, request):
    if request.user.is_superuser:
      return
    return cache.get(request.get_full_path())

  def set_list_cache(self, request, value):
    return cache.set(request.get_full_path(), value)

  class Meta:
    model = Room
    fields = ['name', 'key', 'world', 'zone', 'data']

@unrest_schema.register
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

@unrest_schema.register
class ZoneForm(forms.ModelForm):
  user_can_GET = user_can_LIST = 'ALL'
  filter_fields = ['world__slug']
  class Meta:
    model = Zone
    fields = ['name', 'slug', 'data', 'world']


@unrest_schema.register
class ItemForm(forms.ModelForm):
  user_can_GET = user_can_LIST = 'ALL'
  filter_fields = ['zone__world_id']
  class Meta:
    model = Item
    fields = ['room', 'zone', 'data']


@unrest_schema.register
class VideoForm(forms.ModelForm):
  user_can_GET = user_can_LIST = 'ALL'
  filter_fields = ['world__slug']
  readonly_fields = ['channel_icon', 'channel_name', 'thumbnail_url']
  class Meta:
    model = Video
    fields = ['source', 'external_id', 'title', 'label', 'data']


@unrest_schema.register
class RunForm(forms.ModelForm):
  user_can_GET = user_can_LIST = 'ALL'
  filter_fields = ['world__slug', 'user_id']
  class Meta:
    model = Run
    fields = ['data', 'user', 'world']


@unrest_schema.register
class SmileSprite(forms.ModelForm):
  user_can_GET = user_can_LIST = 'ALL'
  readonly_fields = ['url']
  class Meta:
    model = SmileSprite
    fields = ['type', 'category', 'modifier', 'color', 'layer', 'template']
