from django import forms
from unrest import schema

from .models import World, Room

@schema.register
class WorldForm(forms.ModelForm):
  class Meta:
    model = World
    fields = ('name', 'slug')
  user_can_GET = 'ANY'
  user_can_LIST = 'ANY'

@schema.register
class RoomForm(forms.ModelForm):
  class Meta:
    model = Room
    fields = ['name', 'key', 'world']
  user_can_GET = 'ANY'
  user_can_LIST = 'ANY'