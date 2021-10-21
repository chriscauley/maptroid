import _setup

from maptroid.models import *

for s in Screenshot.objects.all():
    s.reprocess()