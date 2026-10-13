"""
Serializers for the AI chatbot endpoint.
"""
from rest_framework import serializers


class ChatMessageSerializer(serializers.Serializer):
    """Incoming request: the customer's message + optional conversation history."""

    message = serializers.CharField(
        max_length=1000,
        help_text="The customer's latest message to the chatbot.",
    )
    history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        help_text=(
            "Previous conversation turns. "
            "Each item must have 'role' ('user' or 'model') and 'parts' (list of strings)."
        ),
    )

    def validate_history(self, value):
        """Light validation of the history structure."""
        for turn in value:
            if "role" not in turn or turn["role"] not in ("user", "model"):
                raise serializers.ValidationError(
                    "Each history item must have 'role': 'user' or 'model'."
                )
            if "parts" not in turn or not isinstance(turn["parts"], list):
                raise serializers.ValidationError(
                    "Each history item must have 'parts': [string]."
                )
        return value


class ChatResponseSerializer(serializers.Serializer):
    """Outgoing response shape (for schema documentation only)."""
    reply = serializers.CharField()
