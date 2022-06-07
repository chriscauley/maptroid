from django import forms

import unrest_schema

from sprite.models import PlmSprite, MatchedSprite


@unrest_schema.register
class PlmSpriteForm(forms.ModelForm):
  user_can_GET = user_can_LIST = 'ALL'
  readonly_fields = ['url']
  filter_fields = ['matchedsprite__isnull']
  class Meta:
    model = PlmSprite
    fields = ['layer', 'matchedsprite', 'datahash']

@unrest_schema.register
class MatchedSpriteForm(forms.ModelForm):
  plmsprite = forms.IntegerField(widget=forms.HiddenInput())
  user_can_GET = user_can_LIST = 'ALL'
  readonly_fields = ['url']
  class Meta:
    model = MatchedSprite
    fields = ['type', 'category', 'modifier', 'color', 'plmsprite']

  def save(self, commit=True):
    instance = self.instance
    plm = PlmSprite.objects.get(id=self.cleaned_data['plmsprite'])
    instance.image = plm.image
    instance = super().save(commit)
    plm.match_method = 'creation'
    plm.matchedsprite = instance
    plm.save()
    return instance