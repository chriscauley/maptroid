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

def serialize_plmsprite(plmsprite):
    return {
        key: getattr(plmsprite, key)
        for key in ['id', 'url', 'data', 'extra_plmsprite_id', 'approved']
    }

def serialize_matchedsprite(matchedsprite):
    return {
        key: getattr(matchedsprite, key)
        for key in ['id', 'url', 'type', 'category', 'modifier', 'color', 'data']
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

def get_plmsprites_from_root(plmsprite):
    # go up to root plm sprite
    to_check= [plmsprite]
    parents = []
    while to_check:
        target = to_check.pop()
        if target.plmsprite_set.all().count():
            for parent in target.plmsprite_set.all():
                if target.extra_plmsprite == target:
                    # one member loops are possible
                    continue
                to_check.append(parent)
        else:
            parents.append(target)

    targets = []
    for parent in parents:
        current = parent
        targets.append(current)
        while current.extra_plmsprite:
            if current.extra_plmsprite == current:
                break
            targets.append(current.extra_plmsprite)
            current = current.extra_plmsprite
    return targets

@user_passes_test(lambda u: u.is_superuser)
def root_plm(request, plmsprite_id=None):
    plmsprite = get_object_or_404(PlmSprite, id=plmsprite_id)

    targets = get_plmsprites_from_root(plmsprite)
    results = []
    for target in targets:
        data = { 'plmsprite': serialize_plmsprite(target) }
        if target.matchedsprite:
            data['matchedsprite'] = serialize_matchedsprite(target.matchedsprite)
        results.append(data)
    return JsonResponse({ 'results': results })

@user_passes_test(lambda u: u.is_superuser)
def reset_to_root(request, plmsprite_id=None):
    plmsprite = get_object_or_404(PlmSprite, id=plmsprite_id)
    targets = get_plmsprites_from_root(plmsprite)[::-1]

    kept = []
    deleted = []
    for target in targets:
        if target.plmsprite_set.count():
            deleted.append(target.id)
            print('should only delete 1', target.delete())
        else:
            kept.append(target.id)
    for id in kept:
        target = PlmSprite.objects.get(id=id)
        target.matchedsprite = None
        target.save()
    return JsonResponse({'message': f'Deleted: {deleted}. Kept: {kept}'})

@user_passes_test(lambda u: u.is_superuser)
def matchedsprite_detail(request, matchedsprite_id=None):
    matchedsprite = get_object_or_404(MatchedSprite, id=matchedsprite_id)
    data = serialize_matchedsprite(matchedsprite)
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

