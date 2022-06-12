from django.contrib import admin
from django.utils.safestring import mark_safe

from sprite.models import PlmSprite, MatchedSprite

class BaseSpriteAdmin(admin.ModelAdmin):
    readonly_fields = ['_img_tag']
    def _img_tag(self, obj=None):
        if obj:
            w = obj.data['width']*4
            s = 'image-rendering: pixelated'
            return mark_safe(f'doot <img src="{obj.url}" width="{w}" style="{s}" />')


@admin.register(MatchedSprite)
class MatchedSpriteAdmin(BaseSpriteAdmin):
    pass


@admin.register(PlmSprite)
class PlmSpriteAdmin(BaseSpriteAdmin):
    pass
