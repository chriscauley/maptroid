from django.conf import settings
from django.contrib.auth.decorators import user_passes_test
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
import json
from pathlib import Path

from sprite.models import PlmSprite, MatchedSprite

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

def serialize_plmsprite(sprite):
    return {
        key: getattr(sprite, key)
        for key in ['id', 'url', 'data', 'extra_plmsprite_id', 'approved']
    }

@user_passes_test(lambda u: u.is_superuser)
def plmsprite_detail(request, plmsprite_id=None):
    plmsprite = get_object_or_404(PlmSprite, id=plmsprite_id)
    children = []
    current = plmsprite
    while current.extra_plmsprite and current.id != current.extra_plmsprite_id:
        current = current.extra_plmsprite
        children.append(serialize_plmsprite(current))
    data = serialize_plmsprite(plmsprite)
    data['children'] = children
    return JsonResponse(data)

@user_passes_test(lambda u: u.is_superuser)
def matchedsprite_detail(request, matchedsprite_id=None):
    matchedsprite = get_object_or_404(MatchedSprite, id=matchedsprite_id)
    data = {
        key: getattr(matchedsprite, key)
        for key in ['id', 'url', 'type', 'category', 'modifier', 'color', 'data']
    }
    data['plmsprites'] = [serialize_plmsprite(s) for s in matchedsprite.plmsprite_set.all()]
    return JsonResponse(data)

@user_passes_test(lambda u: u.is_superuser)
def approve_matchedsprite(request, matchedsprite_id=None):
    matchedsprite = get_object_or_404(MatchedSprite, id=matchedsprite_id)
    matchedsprite.data['approval_count'] = matchedsprite.plmsprite_set.all().count()
    matchedsprite.save()
    return JsonResponse({})

@user_passes_test(lambda u: u.is_superuser)
def force_match(request, plmsprite_id=None, matchedsprite_id=None):
    matchedsprite = get_object_or_404(MatchedSprite, id=matchedsprite_id)
    plmsprite = get_object_or_404(PlmSprite, id=plmsprite_id)
    plmsprite.automatch(sprites=[matchedsprite])
    return JsonResponse({
        **plmsprite.book.data,
        'url': plmsprite.book.url,
        'results': [str(matchedsprite)],
    })

