from django.contrib import admin
from django.urls import include, path, re_path
from unrest.views import index
from maptroid.views import list_rooms, list_worlds
from main.views import list_dir, delete_file

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/rooms/', list_rooms),
    path('api/worlds/', list_worlds),
    re_path('^(screenshot-viewer|editor|viewer|file-browser)', index),
    path('api/list-dir/', list_dir),
    path('api/delete-file/', delete_file),
    path('', include('unrest.urls')),
]
