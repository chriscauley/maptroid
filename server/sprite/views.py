from django.conf import settings
from django.http import HttpResponse
import json
from pathlib import Path

def power_suit(request):
    path = Path(settings.BASE_DIR / '../static/sm/power-suit.json')
    if request.method == "POST":
        path.write_text(request.body.decode('utf-8'))
    return HttpResponse(path.read_text())
