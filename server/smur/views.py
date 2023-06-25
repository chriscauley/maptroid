from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

import json

from smur import get_randomizer

SKIPS = ['draygon', 'phantoon', 'kraid', 'ridley']

@csrf_exempt
def solve(request):
    data = json.loads(request.body.decode('utf-8') or "{}")
    randomizer = get_randomizer(data['world'])
    logic = randomizer.get_logic(data['logic'])
    loadout = randomizer.Loadout('whatever')
    for slug, quantity in data['inventory'].items():
        if slug in SKIPS:
            continue
        name = randomizer.name_by_slug[slug]
        item = randomizer.item_by_name[name]
        print(slug, name, item)
        loadout.contents[item] = quantity
    locations = {}
    for name, func in logic.location_logic.items():
        locations[name] = func(loadout)
    return JsonResponse({'locations': locations})