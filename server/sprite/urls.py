from django.urls import path

from sprite import views


urlpatterns = [
    path('spritesheet/<name>/', views.spritesheet),
    path('root-plm/<plmsprite_id>/', views.root_plm),
    path('reset-to-root/<plmsprite_id>/', views.reset_to_root),
    path('automatch/<plmsprite_id>/', views.automatch),
    path('plmsprite/<plmsprite_id>/', views.plmsprite_detail),
    path('matchedsprite/<matchedsprite_id>/', views.matchedsprite_detail),
    path('approve-matchedsprite/<matchedsprite_id>/', views.approve_matchedsprite),
    path('force-match/<plmsprite_id>/<matchedsprite_id>/', views.force_match),
]
