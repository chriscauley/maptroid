from django.conf import settings
from django.http import HttpResponse
import json
from pathlib import Path

def spritesheet(request, name):
    path = Path(settings.BASE_DIR / f'../static/sm/{name}.json')
    if request.method == "POST":
        data = json.loads(request.body.decode('utf-8'))
        path.write_text(json.dumps(data, indent=2))
    return HttpResponse(path.read_text())
