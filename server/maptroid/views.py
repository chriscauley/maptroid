from django.http import JsonResponse
from unrest.pagination import paginate

from maptroid.models import Room, World

def serialize(item, fields):
  return { field: getattr(item, field) for field in fields }

def list_rooms(request):
  query = Room.objects.all()
  if 'world_id' in request.GET:
    query = query.filter(world_id=request.GET['world_id'])
  process = lambda i: serialize(i, ['id', 'name', 'key', 'world_id'])
  return JsonResponse(paginate(query, process=process, query_dict=request.GET, per_page=500))

def list_worlds(request):
  query = World.objects.all()
  process = lambda i: serialize(i, ['id', 'name', 'slug'])
  return JsonResponse(paginate(query, process=process, query_dict=request.GET))