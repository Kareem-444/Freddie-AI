from django.urls import path
from . import views

urlpatterns = [
    # Module management
    path('modules/', views.list_modules, name='list_modules'),
    path('modules/downloaded/', views.list_downloaded_modules, name='list_downloaded'),
    path('modules/download/', views.download_module, name='download_module'),
    path('modules/cancel/', views.cancel_download, name='cancel_download'),  # NEW!
    path('modules/download-status/<str:module_id>/', views.download_status, name='download_status'),
    path('modules/download-status/', views.all_downloads_status, name='all_downloads_status'),
    path('modules/delete/', views.delete_module, name='delete_module'),
    path('modules/load/', views.load_module, name='load_module'),
    path('modules/status/', views.model_status, name='model_status'),
    
    # Chat
    path('chat/', views.chat, name='chat'),
]