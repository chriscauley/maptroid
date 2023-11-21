from django.http import JsonResponse
from django.shortcuts import get_object_or_404
import json

from .models import Tracker

def serialize(tracker):
    return {
        key: getattr(tracker, key)
        for key in ['id', 'data', 'external_data', 'slug']
    }

def tracker_view(request, slug):
    tracker = get_object_or_404(Tracker, slug=slug, active=True)
    user_type = None
    if tracker.password == request.GET.get('password'):
        user_type = 'admin'
    if user_type is None:
        return JsonResponse({'error': 'BAD_PASSWORD'}, status=403)
    if request.method == 'PUT':
        data = json.loads(request.body.decode('utf-8') or "{}")
        action = data.get('action')
        if action == 'check-password':
            pass
        elif action == 'reset-room':
            tracker.active = False
            tracker.save()
            tracker = Tracker.objects.create(
                slug=tracker.slug,
                password=tracker.password,
                active=True,
            )
        elif action == 'add-action':
            tracker.data['actions'] = tracker.data.get('actions') or []
            tracker.data['actions'].append(data['value'])
            tracker.save()
        elif action == 'set-objectives':
            tracker.data['objectives'] = data['value']
            tracker.save()
        else:
            error = f'Unknown action: {action}'
            return JsonResponse({ 'error': error }, status=400)
    return JsonResponse(serialize(tracker))