from django.conf import settings
from django.db import models

_choices = lambda l: zip(l,l)

class Skill(models.Model):
    name = models.CharField(max_length=128)
    description = models.TextField()
    DIFFICULTIES = ['noob', 'beginner', 'intermediate', 'advanced', 'master']
    difficulty = models.CharField(max_length=16, choices=_choices(DIFFICULTIES))
    rooms = models.ManyToManyField('maptroid.Room')
    videos = models.ManyToManyField('maptroid.Video', through='SkillVideo')
    data = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name

    @property
    def video_ids(self):
        return []

    @property
    def room_ids(self):
        return [r.id for r in self.rooms.all()]


class SkillVideo(models.Model):
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    video = models.ForeignKey('maptroid.Video', on_delete=models.CASCADE)
    start_time = models.IntegerField(null=True, blank=True)
    end_time = models.IntegerField(null=True, blank=True)
    data = models.JSONField(default=dict, blank=True)


class SkillResource(models.Model):
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='skill_resources', null=True, blank=True)
    title = models.CharField(max_length=128)
    description = models.TextField()
    data = models.JSONField(default=dict, blank=True)


class UserSkill(models.Model):
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    score = models.IntegerField()
    note = models.CharField(max_length=256, blank=True, default='')
    history = models.JSONField(default=list, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
