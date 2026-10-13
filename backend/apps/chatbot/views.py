"""
Views for the AI customer support chatbot.
"""
import logging

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.permissions import IsCustomer
from core.responses import error_response, success_response

from .serializers import ChatMessageSerializer, ChatResponseSerializer
from .services import get_chat_response

logger = logging.getLogger(__name__)


class ChatView(APIView):
    """
    POST /api/chat/

    Send a message to the AI customer support chatbot.
    The AI has access to the customer's real order history and the
    live product catalogue to give accurate, personalised answers.

    Requires: IsAuthenticated + IsCustomer
    """

    permission_classes = [IsAuthenticated, IsCustomer]

    @extend_schema(
        tags=["Chatbot"],
        summary="Send a message to the AI customer support chatbot",
        request=ChatMessageSerializer,
        responses={200: ChatResponseSerializer},
    )
    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed.", errors=serializer.errors)

        message = serializer.validated_data["message"]
        history = serializer.validated_data["history"]

        try:
            reply = get_chat_response(
                message=message,
                customer=request.user,
                history=history,
            )
        except EnvironmentError as e:
            logger.warning("Chatbot configuration error: %s", e)
            return error_response(str(e), status=503)
        except Exception as e:
            logger.error("Chatbot generation error: %s", e, exc_info=True)
            err_str = str(e).lower()
            if "resourceexhausted" in err_str or "quota" in err_str or "429" in err_str:
                msg = "Google Gemini rate limit / daily free-tier quota exceeded. Please wait a moment or try again later."
            else:
                msg = "The AI assistant is currently unavailable. Please try again later."

            errors = {"detail": str(e)} if settings.DEBUG else {}
            return error_response(msg, errors=errors, status=503)

        return success_response(
            data={"reply": reply},
            message="Response generated.",
        )
