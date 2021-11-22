from django.contrib import admin
from maptroid.models import Zone, Item,  Room, World, Screenshot, Video, Channel


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ['name', '_screenshot_count', '_item_count', '_px_per_block']

    def _screenshot_count(self, obj):
        return obj.screenshot_set.all().count()

    def _item_count(self, obj):
        return obj.item_set.all().count()

    def _px_per_block(self, obj):
        # dread only
        if 'screenshot' in obj.data:
            return obj.data['screenshot']['px_per_block']

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    pass


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    pass


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'order']
    list_editable = ['order']


@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
    pass


@admin.register(World)
class WorldAdmin(admin.ModelAdmin):
    pass


@admin.register(Screenshot)
class ScreenshotAdmin(admin.ModelAdmin):
    list_display = ["id", "world", "zone"]
