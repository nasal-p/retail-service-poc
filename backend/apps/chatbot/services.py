"""
AI Customer Support Chatbot — Service Layer.

Uses Google Gemini to answer customer questions about:
  - Their own orders (status, items, payment)
  - Products in the catalogue (price, stock, description)
  - General shop policies

Context is built dynamically from live DB data so the AI always has
up-to-date information without any vector DB or indexing.
"""
import os

import google.generativeai as genai

from apps.orders.models import Order
from apps.products.models import Product


FALLBACK_MODELS = [
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
]

def _get_client(model_name: str | None = None):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GEMINI_API_KEY is not set. "
            "Get a free key at https://aistudio.google.com and add it to your .env file."
        )
    genai.configure(api_key=api_key)
    selected_model = model_name or os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")
    return genai.GenerativeModel(
        model_name=selected_model,
        generation_config={
            "temperature": 0.4,
            "max_output_tokens": 512,
        },
    )


# ── Context builders ───────────────────────────────────────────────────────────

def _build_orders_context(customer) -> str:
    """Return a text summary of the customer's recent orders."""
    orders = (
        Order.objects.filter(customer=customer)
        .prefetch_related("items__product")
        .order_by("-created_at")[:5]
    )

    if not orders:
        return "The customer has no orders yet."

    lines = ["=== Customer's Recent Orders ==="]
    for order in orders:
        lines.append(
            f"\nOrder #{order.order_number} | "
            f"Status: {order.order_status} | "
            f"Payment: {order.payment_status} ({order.payment_method}) | "
            f"Total: ${order.total_amount} | "
            f"Placed: {order.created_at.strftime('%Y-%m-%d')}"
        )
        for item in order.items.all():
            lines.append(
                f"  - {item.quantity}× {item.product.name} "
                f"({item.product.brand}) @ ${item.unit_price} each"
            )

    return "\n".join(lines)


def _build_products_context() -> str:
    """Return a summary of active products in the catalogue."""
    products = (
        Product.objects.filter(status=Product.Status.ACTIVE)
        .select_related("category")
        .order_by("category__name", "name")[:50]  # cap to avoid huge prompts
    )

    if not products:
        return "No active products currently."

    lines = ["=== Product Catalogue ==="]
    current_cat = None
    for p in products:
        if p.category.name != current_cat:
            current_cat = p.category.name
            lines.append(f"\n[{current_cat}]")
        stock_label = f"{p.stock_quantity} in stock" if p.stock_quantity > 0 else "OUT OF STOCK"
        lines.append(
            f"  • {p.brand} {p.name} (SKU: {p.sku}) — ${p.price} — {stock_label}"
        )
        if p.description:
            lines.append(f"    {p.description[:120]}...")

    return "\n".join(lines)


# ── System prompt ──────────────────────────────────────────────────────────────

SYSTEM_PROMPT_TEMPLATE = """You are a friendly and knowledgeable customer support assistant
for a retail mobile phone shop. Your job is to help customers with:

1. Their order status and history
2. Product information, pricing, and availability
3. General shop policies (returns, warranties, payment methods)

IMPORTANT RULES:
- Be concise, warm, and professional.
- Only answer questions based on the data provided below.
- If you don't know something (e.g. shop-specific policy not listed), say so honestly.
- Never make up prices, order numbers, or stock levels.
- Format currency as USD ($).
- Keep replies under 150 words unless a detailed list is needed.

--- LIVE DATA ---

{orders_context}

{products_context}

--- END OF DATA ---

Now answer the customer's question below."""


# ── Main chat function ─────────────────────────────────────────────────────────

def get_chat_response(message: str, customer, history: list[dict]) -> str:
    """
    Generate an AI reply for a customer message.

    Args:
        message:   The latest customer message.
        customer:  The authenticated Django user (customer).
        history:   List of previous turns: [{"role": "user"|"model", "parts": ["text"]}]

    Returns:
        The AI's reply as a plain string.
    """
    # Build live context
    orders_ctx = _build_orders_context(customer)
    products_ctx = _build_products_context()
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        orders_context=orders_ctx,
        products_context=products_ctx,
    )

    # Prepend system instructions as first user/model exchange (Gemini style)
    full_history = [
        {"role": "user", "parts": [system_prompt]},
        {"role": "model", "parts": ["Understood! I'm ready to help your customers. What's their question?"]},
    ] + history

    primary_model = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")
    models_to_try = [primary_model] + [m for m in FALLBACK_MODELS if m != primary_model]

    last_error = None
    for model_name in models_to_try:
        try:
            model = _get_client(model_name=model_name)
            chat = model.start_chat(history=full_history)
            response = chat.send_message(message)
            return response.text
        except Exception as e:
            last_error = e
            # Try next model if quota or model unavailable
            continue

    if last_error:
        raise last_error
    raise RuntimeError("Failed to generate response from any available AI model.")
