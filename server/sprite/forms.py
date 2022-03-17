import cv2
from django.conf import settings
from django import forms
import json
import numpy as np
from pathlib import Path
from unrest import schema
import urcv

from sprite.models import PowerSuit


def load_power_suit():
    sm = Path(settings.BASE_DIR / '../static/sm/')
    rects = json.loads((sm / 'power-suit.json').read_text())
    image = cv2.imread(str(sm / 'power-suit.png'), cv2.IMREAD_UNCHANGED)
    return rects, image

@schema.register
class PowerSuitForm(forms.ModelForm):
    class Meta:
        model = PowerSuit
        fields = ['name', 'data']
    def save(self, *args, **kwargs):
        # todo this should be a regenreate function. Maybe on the model
        sprite = super().save(*args, **kwargs)
        rects, image = load_power_suit()
        rects = [rects[i] for i in sprite.data['indexes']]
        if not rects:
            return sprite
        w = max([r[2] for r in rects])
        h = max([r[3] for r in rects])

        new_image = np.zeros((h * len(rects), w, 4), np.uint8)
        for i, rect in enumerate(rects):
            sx, sy, sw, sh = rect
            dx = 0
            dy = i * h
            _clipped = image[sy:sy+sh,sx:sx+sw]
            urcv.draw.paste(new_image, _clipped, dx, dy)

        cv2.imwrite(str(Path(settings.MEDIA_ROOT) / f'trash/{sprite.name}.png'), new_image)
        sprite.data['size'] = (w, h)
        sprite.data['frames'] = len(rects)
        sprite.save()
        return sprite