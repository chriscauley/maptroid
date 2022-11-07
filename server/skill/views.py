from django.http import JsonResponse

from maptroid.models import Room, Zone


def room_search(request):
    if not request.GET.get('q'):
        return JsonResponse(dict(extra=0, rooms=[]))
    zones = { z.id: z.slug for z in Zone.objects.filter(world_id=1) }
    rooms = Room.objects.filter(world_id=1,name__icontains=request.GET['q'])
    def serialize(room):
        return {
            'name': room.name,
            'id': room.id,
            'zone': zones.get(room.zone_id),
        }
    return JsonResponse(dict(
        extra = max(0, rooms.count() - 10),
        rooms = [serialize(r) for r in rooms[:10]],
    ))