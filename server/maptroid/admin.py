from django.contrib import admin
from maptroid.models import Zone, Room, World, Screenshot


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    pass

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    pass

@admin.register(World)
class WorldAdmin(admin.ModelAdmin):
    pass

@admin.register(Screenshot)
class ScreenshotAdmin(admin.ModelAdmin):
    pass