import _setup
import datetime

from maptroid.models import *

i = 0
count = Screenshot.objects.all().count()
start = datetime.datetime.now()

for s in Screenshot.objects.all():
    s.reprocess()
    if i % 100 == 1:
        seconds = int((datetime.datetime.now() - start).total_seconds())
        print(f"{i-1} / {count} @ {int(seconds / 60)}:{seconds%60}")
    i += 1
