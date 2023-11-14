from django.contrib import admin
from django.urls import include, path, re_path
from django.http import HttpResponseRedirect
from unrest.views import index

from main.smur import explore
from main.views import list_dir, delete_file, swap_room_event, save_default_event, winderz, event_action
from maptroid.views import replace_svg_color, smile_ocr, save_sprite, sprite_distances, goto_room
from tracker.views import tracker_view
from skill.views import save_user_skill

# these views are registered using unrest_schema.register
import maptroid.forms
import sprite.forms
import unrest.user.forms
import contact.forms
import skill.forms

from contact.views import simple_upload

def dread_redirect(request, *args, **kwargs):
    path = request.get_full_path().split('dread/')[-1]
    return HttpResponseRedirect('/maps/metroid-dread/'+path)

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
    "staff",
    "sm",
    "sprite",
    "trainer",
    "varia",
    "viewer",
    "world-tiles",
]

urlpatterns = [
    path('djadmin/', admin.site.urls),
    re_path('^dread', dread_redirect),
    re_path('^maps/dread', dread_redirect),
    re_path(f'^({"|".join(app_urls)})', index),
    path('api/explore/', explore),
    path('api/list-dir/', list_dir),
    path('api/delete-file/', delete_file),
    path('api/replace-svg-color/', replace_svg_color),
    path('api/smile-ocr/', smile_ocr),
    path('api/save-sprite/', save_sprite),
    path('api/sprite/', include('sprite.urls')),
    path('api/winderz/<world_slug>/', winderz),
    path('api/swap-room-event/', swap_room_event),
    path('api/save-default-event/', save_default_event),
    path('api/room/event/', event_action),
    path('api/save-user-skill/', save_user_skill),
    path('api/multi-tracker/<slug>/', tracker_view),
    path('room/<room_id>/', goto_room),
    path('upload_file/<world_slug>/', simple_upload),
    path('', include('social_django.urls', namespace='social')),
    path('', include('unrest.urls')),
]
