from django.contrib import admin
from django.urls import include, path, re_path
from unrest.views import index

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('unrest.urls')),
]
