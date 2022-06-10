from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.decorators import user_passes_test
import json
from pathlib import Path

from sprite.models import PlmSprite

def spritesheet(request, name):
    path = Path(settings.BASE_DIR / f'../static/sm/{name}.json')
    if request.method == "POST":
        data = json.loads(request.body.decode('utf-8'))
        path.write_text(json.dumps(data, indent=2))
    return HttpResponse(path.read_text())


@user_passes_test(lambda u: u.is_superuser)
def automatch(request, plmsprite_id=None):
    plmsprite = PlmSprite.objects.get(id=plmsprite_id)
    plmsprite.automatch(force=True)
    results = []
    if plmsprite.matchedsprite:
        results.append(plmsprite.matchedsprite.type)
    current = plmsprite
    while current.extra_plmsprite and current.extra_plmsprite.id != current.id:
        current = current.extra_plmsprite
        if current.matchedsprite:
            results.append(current.matchedsprite.type)

    if len(results) == 1:
        # only one layer deep of match, return more verbose description
        results = [plmsprite.matchedsprite.short_code]
    return JsonResponse({
        **plmsprite.book.data,
        'url': plmsprite.book.url,
        'results': results,
    })