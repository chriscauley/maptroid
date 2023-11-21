from django.contrib import admin
from .models import Tracker

@admin.register(Tracker)
class TrackerAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'active', 'action_count']
    list_editable = ['active']
    def action_count(self, obj):
        return len(obj.data.get('actions', []))