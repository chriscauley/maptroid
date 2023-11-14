from django.http import JsonResponse
from django.shortcuts import get_object_or_404
import json

from .models import Tracker

def serialize(tracker):
    return {
        key: getattr(tracker, key)
        for key in ['data', 'external_data', 'slug', 'password']
    }

def tracker_view(request, slug):
    tracker = get_object_or_404(Tracker, slug=slug, active=True)
    if request.method == 'PUT':
        data = json.loads(request.body.decode('utf-8') or "{}")
        print(data.get('password'))
        if data.get('password') != tracker.password:
            return JsonResponse({'error': 'BAD_PASSWORD'}, status=403)
        action = data.get('action')
        if action == 'password': # just checking!
            pass
        elif action == 'reest':
            tracker.active = False
            tracker.save()
            tracker = Tracker.objects.create(
                slug=tracker.slug,
                password=tracker.slug,
            )
        elif action == 'add-action':
            tracker.data['actions'] = tracker.data.get('actions') or []
            tracker.data['actions'].append(data['value'])
            tracker.save()
        else:
            error = f'Unknown action: {action}'
            return JsonResponse({ 'error': error }, status=400)
    return JsonResponse(serialize(tracker))