from django import forms
import unrest_schema

from skill.models import Skill, SkillVideo, SkillResource, UserSkill

@unrest_schema.register
class SkillForm(forms.ModelForm):
    def prep_schema(self, schema):
        schema['properties']['rooms'] = {
            'type': 'array',
            'items': { 'type': 'number' }
        }
        instance = self.instance
        if instance and instance.id:
            ids = list(instance.rooms.all().values_list('id', flat=True))
            schema['properties']['rooms']['default'] = ids
    user_can_LIST = 'any'
    readonly_fields = ['video_ids', 'room_ids']
    class Meta:
        model = Skill
        fields = ('name', 'description', 'difficulty')

    def get_queryset(self, request):
        return Skill.objects.all().prefetch_related('rooms')

    def save(self, *args, **kwargs):
        instance = super().save(*args, **kwargs)
        instance.rooms.clear()
        for _id in self.request_data.get('rooms', []):
            instance.rooms.add(_id)
        instance.save()
        return instance


# @unrest_schema.register
# class SkillVideo(forms.ModelForm):
#     class Meta:
#         model = SkillVideo