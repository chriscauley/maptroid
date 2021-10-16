from django import forms
from unrest import schema

from .models import World, Room, Screenshot

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
  class Meta:
    model = Screenshot
    fields = ['image', 'world', 'zone']
