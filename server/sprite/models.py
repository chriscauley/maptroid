from django.db import models


class PowerSuit(models.Model):
    name = models.CharField(max_length=16)
    data = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name