from django.contrib import admin
from django.urls import include, path, re_path
from unrest.views import index
from main.views import list_dir, delete_file

import maptroid.forms

urlpatterns = [
    path('djadmin/', admin.site.urls),
    re_path('^(admin|dread.*|screenshot.*|editor|viewer|file-browser|world-tiles)', index),
    path('api/list-dir/', list_dir),
    path('api/delete-file/', delete_file),
    path('', include('unrest.urls')),
]
