from django.contrib import admin
from maptroid.models import Zone, Room, World, Screenshot


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ['name', '_screenshot_count']
    def _screenshot_count(self, obj):
        return obj.screenshot_set.all().count()

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    pass

@admin.register(World)
class WorldAdmin(admin.ModelAdmin):
    pass

@admin.register(Screenshot)
class ScreenshotAdmin(admin.ModelAdmin):
    list_display = ["id", "world", "zone"]