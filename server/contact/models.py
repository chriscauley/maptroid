from django.db import models


class Message(models.Model):
    email = models.CharField(max_length=128, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    body = models.TextField()
    __str__ = lambda self: f'{self.email} - {self.created.date()}'