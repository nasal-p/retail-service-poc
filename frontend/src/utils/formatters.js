// Formatters for currency, dates, and status strings

export const formatCurrency = (amount) => {
  const numeric = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numeric);
};

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatShortDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

export const formatStatusText = (status) => {
  if (!status) return "";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const SKU_PRODUCT_IMAGES = {
  "APL-IPH15P-256": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80",
  "SAM-S24U-512": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80",
  "APL-IPADAIR-M2": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80",
  "ANK-GAN65W": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80",
  "BLK-SCRPRO-IP15P": "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=600&q=80",
  "SNY-WF1000XM5": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
  "PRT-IPH15P-DISP": "https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?auto=format&fit=crop&w=600&q=80",
};

// Derive the backend media root from the same env var used for API calls
const _apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const MEDIA_BASE = _apiBase.replace(/\/api\/?$/, "");

/**
 * Returns a fully-resolved image URL for a product.
 *
 * Priority:
 *  1. `image_url` field (if already absolute)
 *  2. `image` field  — Django ImageField, may be a relative /media/... path
 *  3. SKU-based lookup in the local map above
 *  4. Category-name based Unsplash fallback
 *  5. Generic smartphone fallback
 */
export const getProductImage = (product) => {
  const FALLBACK = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80";

  if (!product) return FALLBACK;

  // Helper: turn a relative /media/... path into an absolute URL
  const resolve = (raw) => {
    if (!raw || typeof raw !== "string" || raw.trim() === "") return null;
    // Already absolute (http/https/data)
    if (/^https?:\/\//.test(raw) || raw.startsWith("data:")) return raw;
    // Relative path — prepend backend origin
    return `${MEDIA_BASE}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

  const fromImageUrl = resolve(product.image_url);
  if (fromImageUrl) return fromImageUrl;

  const fromImage = resolve(product.image);
  if (fromImage) return fromImage;

  if (product.sku && SKU_PRODUCT_IMAGES[product.sku]) {
    return SKU_PRODUCT_IMAGES[product.sku];
  }

  // Category based default images
  const catName = (product.category_name || "").toLowerCase();
  if (catName.includes("smartphone") || catName.includes("phone")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80";
  }
  if (catName.includes("tablet") || catName.includes("pad")) {
    return "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80";
  }
  if (catName.includes("audio") || catName.includes("earbud") || catName.includes("headphone")) {
    return "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80";
  }
  if (catName.includes("accessory") || catName.includes("charger")) {
    return "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80";
  }

  return FALLBACK;
};

