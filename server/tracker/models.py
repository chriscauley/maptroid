from django.db import models

class Tracker(models.Model):
    data = models.JSONField(default=dict, blank=True)
    external_data = models.JSONField(default=dict, blank=True)
    slug = models.CharField(max_length=64)
    active  = models.BooleanField()
    password = models.CharField(max_length=64)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f'{self.slug}@{self.created}'

