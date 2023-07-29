from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

import json
import os
import random
import subprocess

ROMS_DIR = getattr(settings, 'ROMS_DIR', '/DNE')

@csrf_exempt
def explore(request):
    options = json.loads(request.body.decode('utf-8') or "{}")
    if request.method == 'GET':
        return JsonResponse({'error': 'GET not allowed'}, status=405)
    dirs = {
        'nature': 'natureRando',
        'vitality': 'VitalityRando',
    }
    inventory = []
    for item, quantity in options['inventory'].items():
        inventory += [item] * int(quantity)
    inventory = ','.join(inventory)
    args = ['python3.10', 'web.py']
    if inventory:
        args += ['--inventory', inventory]
    if options.get('can'):
        args += ['--can', ','.join(options['can'])]
    try:
        cwd = os.path.join(ROMS_DIR, dirs[options['world']])
        run = subprocess.run(
            args,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            check=True,
            text=True,
            cwd=cwd,
        )
    except subprocess.CalledProcessError as e:
        print(e.stderr)
        raise e

    return JsonResponse(json.loads(run.stdout))
