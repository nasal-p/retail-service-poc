"""
URL routes for the AI chatbot app.
"""
from django.urls import path

from .views import ChatView

urlpatterns = [
    path("chat/", ChatView.as_view(), name="chat"),
]
