from django.contrib import admin
from django.urls import include, path, re_path
from unrest.views import index
from main.views import list_dir, delete_file

from maptroid.views import process_zone
import maptroid.forms

urlpatterns = [
    path('djadmin/', admin.site.urls),
    re_path('^(admin|dread|process|screenshot|editor|viewer|file-browser|world-tiles)', index),
    path('api/list-dir/', list_dir),
    path('api/delete-file/', delete_file),
    path('api/process-zone/<world_id>/<zone_id>/', process_zone),
    path('', include('unrest.urls')),
]
