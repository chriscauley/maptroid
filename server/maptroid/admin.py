from django.contrib import admin
from maptroid.models import Zone, Item, Room, Run, World, Screenshot, Video, Channel, SmileSprite


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'world']
    list_editable = ['slug']
    list_filter = ['world']

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
    raw_id_fields = ['room']
    list_filter = ['zone']


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_filter = ['zone']
    search_fields = ['key', 'data']


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'order']
    list_editable = ['order']


@admin.register(Run)
class RunAdmin(admin.ModelAdmin):
    pass


@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
    pass


@admin.register(World)
class WorldAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'hidden', 'mc_id', 'data']
    list_editable = ['hidden', 'mc_id']


@admin.register(Screenshot)
class ScreenshotAdmin(admin.ModelAdmin):
    list_display = ["id", "world", "zone"]


@admin.register(SmileSprite)
class SmileSpriteAdmin(admin.ModelAdmin):
    pass
