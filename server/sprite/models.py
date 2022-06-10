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
    data = models.JSONField(default=dict)

    @property
    def url(self):
        return self.image.url
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.datahash or not self.data:
            image = cv2.imread(self.image.path, cv2.IMREAD_UNCHANGED)
            self.datahash = hashlib.md5(image.data.tobytes()).hexdigest()
            self.data = dict(
                primary_color=urcv.top_color(image, exclude=EXCLUDE_COLORS),
                width=image.shape[1],
                height=image.shape[0]
            )
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
    'dust',
    'eye',
    'gold',
    'gray',
    'green',
    'mixed',
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
        values = [self.category, self.type, self.color, self.modifier]
        values = [v for v in values if v]
        return '/'.join(values)

    def __str__(self):
        return self.short_code

def match_template(img1, img2):
    # copy img2 because matchTemplate consumes it
    res = cv2.matchTemplate(img1, img2.copy(), cv2.TM_CCORR_NORMED, mask=img2)
    res[res == float('inf')] = 0 # bug https://github.com/opencv/opencv/issues/15768
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
    )
    MATCHES = _choices(['manual', 'automatch', 'creation'])
    match_method = models.CharField(
        max_length=16,
        blank=True,
        default='',
        choices=MATCHES,
    )
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

    def automatch(self, force=False, sprites=None):
        _data = {
            'id': self.id,
            'url': f'/api/sprite/automatch/{self.id}/'
        }
        self.book = Labbook(f'automatch_plm_{self.id}', _data)
        if not force and self.matchedsprite:
            return
        _pc = self.data['primary_color']
        self.og_image = cv2.imread(self.image.path, cv2.IMREAD_UNCHANGED)
        self.book.add({
            'media': self.image.path,
            'caption': 'og',
            'color': self.data['primary_color'],
        })
        self.gray_image = cv2.cvtColor(self.og_image, cv2.COLOR_BGR2GRAY)

        if sprites is None:
            sprites = MatchedSprite.objects.filter(data__primary_color=_pc)
            sprites = sprites.exclude(category='trash')
            # TODO delete these three lines.
            # They aren't necessary because we're now selecting by threshold
            # def get_minus_size(sprite):
            #     return -cv2.imread(sprite.image.path).size
            # sprites = sorted(sprites, key=get_minus_size)
            threshold = 0.9
        else:
            # much looser threshold for manually specified sprites
            threshold = 0.5

        self.book.add({
            'np': 100 * self.gray_image,
            'caption': 'gray (silhouette)',
        })

        max_result = [0]
        for sprite in sprites:
            new_result = self.direct_match(sprite)
            if new_result[0] > threshold and new_result[0] > max_result[0]:
                max_result = new_result

        if max_result[0] == 0:
            for sprite in sprites:
                new_result = self.half_match(sprite)
                if new_result[0] > threshold and new_result[0] > max_result[0]:
                    max_result = new_result

        if max_result[0] != 0:
            _, match, xy = max_result
            self.matchedsprite = match
            self.data['matchedsprite_xy'] = xy
            self.extract_sprite(match, xy)
            self.save()
            self.book.add({ 'caption': 'success!' })
            self.book.data['success'] = True


    def direct_match(self, matchedsprite):
        gray = self.gray_image
        self.book.add({
            'media': matchedsprite.image.path,
            'caption': matchedsprite.short_code,
            'color': matchedsprite.data['primary_color'],
        })
        image2 = cv2.imread(matchedsprite.image.path, cv2.IMREAD_UNCHANGED)
        gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)
        dx = 0
        dy = 0

        if gray.shape[0] < gray2.shape[0]:
            gray2 = gray2[2:-2]
            dy = -2
        if gray.shape[1] < gray2.shape[1]:
            gray2 = gray2[:,2:-2]
            dx = -2

        if gray.shape[0] < gray2.shape[0] or gray.shape[1] < gray2.shape[1]:
            self.book.add({ 'caption': 'Source and target mismatch size' })
            return 0, None, None

        value, xy = match_template(gray, gray2)
        self.book.add({ 'caption': f'matched at: {value}, {xy}' })
        return value, matchedsprite, [xy[0] + dx, xy[1] + dy]

    def half_match(self, matchedsprite):
        gray = self.gray_image
        image2 = cv2.imread(matchedsprite.image.path, cv2.IMREAD_UNCHANGED)
        gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)
        x_half = int(gray2.shape[1] / 2)
        y_half = int(gray2.shape[0] / 2)

        self.book.add({
            'caption': f'image2 {matchedsprite.id} {matchedsprite.type} {matchedsprite.image.path}',
            'np': image2,
        })

        self.book.add({
            'caption': 'gray2',
            'np': gray2,
        })

        # give it some padding because there's a good chance these will go off the canvas
        canvas = np.zeros(np.add(gray.shape, gray2.shape), dtype=gray.dtype)
        urcv.draw.paste(canvas, gray, x_half, y_half)

        top_half = gray2[:y_half]
        bottom_half = gray2[y_half:]
        left_half = gray2[:,:x_half]
        right_half = gray2[:,x_half:]

        candidates = [
            [top_half, 0, 0],
            [bottom_half, 0, y_half],
            [left_half, 0, 0],
            [right_half, x_half, 0]
        ]
        for target_gray, dx, dy in candidates:
            value, xy = match_template(canvas, target_gray)
            if value > 0.9:
                return value, matchedsprite, [xy[0] - dx - x_half, xy[1] - dy - y_half]
        return 0, None, None

    def extract_sprite(self, matchedsprite, xy):
        x, y = xy

        to_delete = self.og_image.copy()
        to_delete[:] = 0
        image2 = cv2.imread(matchedsprite.image.path, cv2.IMREAD_UNCHANGED)
        if x < 0:
            image2 = image2[:,:x]
            x = 0
        if y < 0:
            image2 = image2[:y]
            x = 0

        urcv.draw.paste(to_delete, image2, xy[0], xy[1])
        self.book.add({
            'np': to_delete,
            'caption': 'to remove'
        })

        gray_to_delete = cv2.cvtColor(to_delete, cv2.COLOR_BGR2GRAY)
        self.book.add({
            'np': gray_to_delete,
            'caption': 'gray delete2',
        })
        delta_delete = cv2.subtract(self.gray_image, gray_to_delete)

        self.book.add({
            'np': delta_delete * 100,
            'caption': 'delta_delete (x100)',
        })

        thresh = cv2.threshold(delta_delete, 10, 255, cv2.THRESH_BINARY)[1]
        self.book.add({
            'np': thresh,
            'caption': 'thresh',
        })

        extra = cv2.bitwise_and(self.og_image, self.og_image, mask=thresh)
        gray_extra = cv2.cvtColor(extra, cv2.COLOR_BGR2GRAY)
        kernel = np.ones((3, 3),np.uint8)
        gray_extra = cv2.erode(gray_extra, kernel, iterations = 1)

        self.book.add({
            'np': extra,
            'caption': f'extra: {np.sum(gray_extra)}',
        })

        if np.sum(gray_extra):
            extra_x = extra_y = 0
            while np.sum(extra[0,:,3]) == 0:
                extra_y += 1
                extra = extra[1:]
            while np.sum(extra[-1,:,3]) == 0:
                extra = extra[:-1]
            while np.sum(extra[:,0,3]) == 0:
                extra_x += 1
                extra = extra[:,1:]
            while np.sum(extra[:,-1,3]) == 0:
                extra = extra[:,:-1]

            new, self.extra_plmsprite = PlmSprite.get_or_create_from_np_array(extra)

            if new:
                self.book.add({ 'caption': 'New PlmSprite created!' })
            self.extra_xy = [extra_x, extra_y]
            self.save()

            self.extra_plmsprite.automatch()
            self.book.add({
                'child_labbook': self.extra_plmsprite.book.name,
            })

def delete_image(source, target, xy, book, gray_image=None):
    # allow gray images to be passed in to save time
    if gray_image is None:
        gray_image = cv2.cvtColor(source, cv2.COLOR_BGR2GRAY)

    x, y = xy
    # if the target is off the canvas, crop the left/top side of target
    if x < 0:
        target = target[:,:x]
        x = 0
    if y < 0:
        target = target[:y]

    to_delete = source.copy()
    to_delete[:] = 0
    image2 = cv2.imread(matchedsprite.image.path, cv2.IMREAD_UNCHANGED)
    urcv.draw.paste(to_delete, image2, xy[0], xy[1])
    book.book.add({
        'np': to_delete,
        'caption': 'to remove'
    })

    gray_to_delete = cv2.cvtColor(to_delete, cv2.COLOR_BGR2GRAY)
    book.book.add({
        'np': gray_to_delete,
        'caption': 'gray delete2',
    })
    delta_delete = cv2.subtract(gray_image, gray_to_delete)

    book.book.add({
        'np': delta_delete * 100,
        'caption': 'delta_delete (x100)',
    })

    thresh = cv2.threshold(delta_delete, 10, 255, cv2.THRESH_BINARY)[1]
    book.book.add({
        'np': thresh,
        'caption': 'thresh',
    })

    extra = cv2.bitwise_and(book.og_image, book.og_image, mask=thresh)


# TODO need to do something like this to verify that images actually have some significant overlap
def verify_pixels(image1, image2, xy):
    x, y = xy
    h, w = image2.shape[:2]

    # 2d array of equal pixels
    matched = image1[y:y+h,x:x+h] == image2

    # but we're only interested in these pixels
    mask = image2 != 0

    # so we filter out pixels we're uninterested in
    matched = cv2.bitwise_and(matched, matched, mask=mask)
    score = np.sum(matched)

    # do the same thing for source template to get possible score
    possible = image2 == image2
    total = np.sum(cv2.bitwise_and(possible, possible, mask=mask))
