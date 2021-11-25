from django.contrib import admin
from django.urls import include, path, re_path
from unrest.views import index
from main.views import list_dir, delete_file

from maptroid.views import replace_svg_color, smile_ocr, save_sprite, sprite_distances
import maptroid.forms
import unrest.user.forms
import contact.forms

urlpatterns = [
    path('djadmin/', admin.site.urls),
    re_path('^(about|admin|auth|contact|dread|downloads|screenshot|editor|viewer|file-browser|sm|world-tiles)', index),
    path('api/list-dir/', list_dir),
    path('api/delete-file/', delete_file),
    path('api/replace-svg-color/', replace_svg_color),
    path('api/smile-ocr/', smile_ocr),
    path('api/save-sprite/', save_sprite),
    path('api/sprite-distances/', sprite_distances),
    path('', include('social_django.urls', namespace='social')),
    path('', include('unrest.urls')),
]
