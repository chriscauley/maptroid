from django import forms
from django.db.models import Count

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
  plmsprite = forms.IntegerField(widget=forms.HiddenInput(), required=False)
  user_can_GET = user_can_LIST = 'ALL'
  readonly_fields = ['url', 'short_code', 'plmsprite__count', 'data']

  class Meta:
    model = MatchedSprite
    fields = ['type', 'category', 'modifier', 'color']

  def get_queryset(self, _request):
    return MatchedSprite.objects.all().annotate(Count('plmsprite'))

  def save(self, commit=True):
    if self.instance.id:
      return super().save(commit)

    # when creating a new matched sprite use the specified plmsprite
    instance = self.instance
    plm = PlmSprite.objects.get(id=self.cleaned_data['plmsprite'])
    instance.image = plm.image
    instance = super().save(commit)
    plm.match_method = 'creation'
    plm.data['matchedsprite_xy'] = [0,0]
    plm.matchedsprite = instance
    plm.save()
    return instance