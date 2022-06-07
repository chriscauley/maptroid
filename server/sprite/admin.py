from django.contrib import admin

from sprite.models import PlmSprite, MatchedSprite

@admin.register(MatchedSprite)
class MatchedSpriteAdmin(admin.ModelAdmin):
    pass

@admin.register(PlmSprite)
class PlmSpriteAdmin(admin.ModelAdmin):
    pass
