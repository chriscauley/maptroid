from django.shortcuts import get_object_or_404
from django.http import JsonResponse
import json

from skill.models import Skill, UserSkill


def save_user_skill(request):
    data = json.loads(request.body.decode('utf-8') or "{}")
    skill = get_object_or_404(Skill, id=data.get('skill_id'))
    userskill = UserSkill.objects.filter(user=request.user, skill=skill).first()
    if userskill:
        userskill.history.append([userskill.score, str(userskill.updated)])
        userskill.score = data.get('score')
        userskill.save()
    else:
        userskill = UserSkill.objects.create(
            user=request.user,
            skill=skill,
            score=data.get('score'),
        )
    return JsonResponse({})