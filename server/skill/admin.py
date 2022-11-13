from django.contrib import admin

from skill.models import UserSkill

@admin.register(UserSkill)
class UserSkill(admin.ModelAdmin):
    pass
