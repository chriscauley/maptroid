from django.contrib import admin
from .models import Tracker

@admin.register(Tracker)
class TrackerAdmin(admin.ModelAdmin):
    pass