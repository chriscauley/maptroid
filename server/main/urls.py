from django.contrib import admin
from django.urls import include, path, re_path
from django.http import HttpResponseRedirect
from unrest.views import index
from main.views import list_dir, delete_file

from maptroid.views import replace_svg_color, smile_ocr, save_sprite, sprite_distances, goto_room

# these views are registered using unrest_schema.register
import maptroid.forms
import sprite.forms
import unrest.user.forms
import contact.forms

def dread_redirect(request, *args, **kwargs):
  return HttpResponseRedirect('/maps'+request.get_full_path())

app_urls = [
  "app",
  "about",
  "admin",
  "auth",
  "contact",
  "downloads",
  "editor",
  "file-browser",
  "gamepad",
  "maps",
  "play",
  "screenshot",
  "sm",
  "sprite",
  "trainer",
  "viewer",
  "world-tiles",
]

urlpatterns = [
    path('djadmin/', admin.site.urls),
    re_path('^dread', dread_redirect),
    re_path(f'^({"|".join(app_urls)})', index),
    path('api/list-dir/', list_dir),
    path('api/delete-file/', delete_file),
    path('api/replace-svg-color/', replace_svg_color),
    path('api/smile-ocr/', smile_ocr),
    path('api/save-sprite/', save_sprite),
    path('api/sprite/', include('sprite.urls')),
    path('room/<room_id>/', goto_room),
    path('', include('social_django.urls', namespace='social')),
    path('', include('unrest.urls')),
]
