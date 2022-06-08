from django.db import models
import hashlib
import cv2
import numpy as np
from skimage.metrics import structural_similarity
import urcv

from labbook import Labbook
from PIL import Image
import unrest_image as img

_choices = lambda l: zip(l,l)

EXCLUDE_COLORS = [
    (0,0,0),
    (255,255,255),
    # (0, 0, 51),
    # (0, 51, 0),
    # (51, 0, 0),
    # (0, 51, 51),
    # (51, 0, 51),
    # (51, 51, 0),
    # (51, 51, 51),
]

class BaseSpriteModel(models.Model):
    class Meta:
        abstract = True
    image = models.ImageField(upload_to="hashed_sprites")
    datahash = models.CharField(max_length=32)
    primary_color = models.JSONField(default=list, null=True, blank=True)

    @property
    def url(self):
        return self.image.url
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.datahash or not self.primary_color:
            image = cv2.imread(self.image.path, cv2.IMREAD_UNCHANGED)
            self.datahash = hashlib.md5(image.data.tobytes()).hexdigest()
            self.primary_color = urcv.top_color(image, exclude=EXCLUDE_COLORS)
            self.save()

modifiers = [
    # for pirates
    'standing',
    'walking',
    'wall',
    # for items
    'inblock',
    'inegg',
    'respawn',
    # doors
    'up',
    'down',
    'left',
    'right',
]

colors = [
    'black',
    'blue',
    'eye',
    'gold',
    'gray',
    'green',
    'orange',
    'pink',
    'purple',
    'red',
    'white',
]

categories = [
    'block',
    'geo',
    'hex',
    'item',
    'enemy',
    'obstacle',
    'door',
    'station',
    'animation',
    'trash',
]

class MatchedSprite(BaseSpriteModel):
    type = models.CharField(max_length=32, blank=True, default='')
    MODIFIERS = _choices(modifiers)
    modifier = models.CharField(max_length=16, choices=MODIFIERS, null=True, blank=True)
    COLORS = _choices(colors)
    color = models.CharField(max_length=16, choices=COLORS, null=True, blank=True)
    CATEGORIES = _choices(categories)
    category = models.CharField(max_length=16, choices=CATEGORIES, null=True, blank=True)

    @property
    def short_code(self):
        values = [self.category, self.type, self.modifier, self.color]
        values = [v for v in values if v]
        return '/'.join(values)

def match_template(img1, img2):
    res = cv2.matchTemplate(img1, img2, cv2.TM_CCOEFF_NORMED, mask=img2)
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)
    return max_val, max_loc


class PlmSprite(BaseSpriteModel):
    LAYERS = _choices(['bts', 'plm', 'tile', 'unknown'])
    layer = models.CharField(max_length=16, choices=LAYERS, default='unknown')
    matchedsprite = models.ForeignKey(
        MatchedSprite,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="+",
    )
    MATCHES = _choices(['manual', 'automatch', 'creation'])
    match_method = models.CharField(
        max_length=16,
        blank=True,
        default='',
        choices=MATCHES,
    )
    match_xy = models.JSONField(default=list)
    extra_plmsprite = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    extra_xy = models.JSONField(default=list)

    @staticmethod
    def get_or_create_from_np_array(np_array):
        datahash = hashlib.md5(np_array.data.tobytes()).hexdigest()
        plmsprite = PlmSprite.objects.filter(datahash=datahash).first()
        if plmsprite:
            return False, plmsprite
        pil = Image.fromarray(cv2.cvtColor(np_array, cv2.COLOR_BGRA2RGBA))
        content_file = img.make_content_file(pil, f'{datahash}.png')
        return True, PlmSprite.objects.create(layer='plm', image=content_file)

    def automatch(self, force=False):
        _data = {
            'id': self.id,
            'url': f'/api/sprite/automatch/{self.id}/'
        }
        book = Labbook(f'automatch_plm_{self.id}', _data)
        if not force and self.matchedsprite:
            return book
        _pc = self.primary_color
        image = cv2.imread(self.image.path, cv2.IMREAD_UNCHANGED)
        book.add({
            'media': self.image.path,
            'caption': 'og',
            'color': self.primary_color,
        })
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        sprites = MatchedSprite.objects.filter(primary_color=_pc)
        book.add({
            'np': gray,
            'caption': 'gray',
        })

        book.data['result'] = 'fail'
        for sprite in sprites:
            book.add({
                'media': sprite.image.path,
                'caption': sprite.short_code,
                'color': self.primary_color,
            })
            image2 = cv2.imread(sprite.image.path, cv2.IMREAD_UNCHANGED)
            gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)

            if gray.shape[0] < gray2.shape[0] or gray.shape[1] < gray2.shape[1]:
                book.add({ 'caption': f'TODO shape mismatch {gray.shape}, {gray2.shape}' })
                continue

            value, (x, y) = match_template(gray, gray2)
            if value < 0.9:
                continue

            self.matchedsprite = sprite
            self.matched_xy = [x, y]
            self.save()
            result = image.copy()
            h, w = result.shape[:2]
            bottom_right = [x + w, y + h]
            cv2.rectangle(result, (x, y), bottom_right, (255, 255, 255, 255), 1)

            to_delete = image.copy()
            to_delete[:] = 0
            urcv.draw.paste(to_delete, image2, x, y)
            book.add({
                'np': to_delete,
                'caption': 'to remove'
            })

            gray_to_delete = cv2.cvtColor(to_delete, cv2.COLOR_BGR2GRAY)
            book.add({
                'np': gray_to_delete,
                'caption': 'gray delete2',
            })
            delta_delete = cv2.subtract(gray, gray_to_delete)

            book.add({
                'np': delta_delete * 100,
                'caption': 'delta_delete (x100)',
            })

            thresh = cv2.threshold(delta_delete, 10, 255, cv2.THRESH_BINARY)[1]
            book.add({
                'np': thresh,
                'caption': 'thresh',
            })

            extra = cv2.bitwise_and(image, image, mask=thresh)
            book.add({
                'np': extra,
                'caption': 'extra',
            })

            gray_extra = cv2.cvtColor(extra, cv2.COLOR_BGR2GRAY)
            kernel = np.ones((5, 5),np.uint8)
            gray_extra = cv2.erode(gray_extra, kernel, iterations = 1)

            if np.sum(gray_extra):
                extra_x = extra_y = 0
                while np.sum(extra[0]) == 0:
                    extra_y += 1
                    extra = extra[1:]
                while np.sum(extra[-1]) == 0:
                    extra = extra[:-1]
                while np.sum(extra[:,0]) == 0:
                    extra_x += 1
                    extra = extra[:,1:]
                while np.sum(extra[:,-1]) == 0:
                    extra = extra[:,:-1]

                new, self.extra_plmsprite = PlmSprite.get_or_create_from_np_array(extra)

                if new:
                    book.add({ 'caption': 'New PlmSprite created!' })
                self.extra_xy = [extra_x, extra_y]
                self.save()

                book2 = self.extra_plmsprite.automatch()
                book.add({
                    'child_labbook': book2.name,
                })

            book.data['result'] = 'success'
            break

        return book