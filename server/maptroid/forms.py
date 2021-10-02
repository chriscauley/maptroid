from django import forms
from unrest import schema

from .models import World, Room

@schema.register
class WorldForm(forms.ModelForm):
  class Meta:
    model = World
    fields = ('name', 'slug')
  user_can_GET = 'ANY'