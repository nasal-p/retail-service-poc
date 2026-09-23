import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Smartphone,
  ShoppingCart,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
} from "lucide-react";
import { productApi } from "../../services/productApi";
import { cartApi } from "../../services/cartApi";
import { formatCurrency, getProductImage } from "../../utils/formatters";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const { isAuthenticated, user, fetchCartCount } = useAuth();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await productApi.getProductById(id);
        const data = res?.data || res;
        setProduct(data);
      } catch (err) {
        showError("Product not found.");
        navigate("/products");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate, showError]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showError("Please log in to add products to your cart.");
      navigate("/login");
      return;
    }
    if (user?.role !== "CUSTOMER") {
      showError("Staff/Admin users cannot add customer cart items.");
      return;
    }

    setIsAdding(true);
    try {
      await cartApi.addToCart(product.id, quantity);
      showSuccess(`Added ${quantity} unit(s) of "${product.name}" to cart!`);
      fetchCartCount();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.quantity ||
        "Failed to add item to cart.";
      showError(msg);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) return <Spinner label="Loading product details..." />;
  if (!product) return null;

  const isOutOfStock = product.stock_quantity <= 0;
  const imageUrl = getProductImage(product);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link to="/products">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Back to Products
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 glass-card rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl">
        {/* Left: Product Image */}
        <div className="aspect-square bg-slate-100/80 rounded-2xl flex items-center justify-center p-8 border border-slate-200/60 relative overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80";
            }}
          />

          <div className="absolute top-4 right-4">
            {isOutOfStock ? (
              <Badge variant="danger">Out of Stock</Badge>
            ) : product.stock_quantity <= 5 ? (
              <Badge variant="warning">Low Stock ({product.stock_quantity} left)</Badge>
            ) : (
              <Badge variant="success">In Stock</Badge>
            )}
          </div>
        </div>

        {/* Right: Details & Purchase Form */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                {product.brand} {product.model ? `• ${product.model}` : ""}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {product.name}
              </h1>
            </div>

            {/* Technical Metadata */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">SKU / Code:</span>
                <span className="font-mono font-bold text-slate-800">{product.sku || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Category:</span>
                <span className="font-bold text-slate-800">{product.category_name || "General"}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Description & Specifications
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {product.description ||
                  "Original manufacturer retail product with full store warranty support."}
              </p>
            </div>

            {/* Price */}
            <div className="pt-2">
              <span className="text-xs text-slate-400 block font-medium">Price</span>
              <span className="text-3xl font-black text-slate-900">
                {formatCurrency(product.price)}
              </span>
            </div>
          </div>

          {/* Quantity Selector & Add to Cart */}
          <div className="pt-6 border-t border-slate-200/80 space-y-4">
            {!isOutOfStock ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center border border-slate-300 rounded-xl bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.min(product.stock_quantity, q + 1))
                    }
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isAdding}
                  isLoading={isAdding}
                  onClick={handleAddToCart}
                  icon={ShoppingCart}
                >
                  Add to Shopping Cart ({formatCurrency(product.price * quantity)})
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                This product is currently out of stock. Purchasing is disabled.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-500 pt-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Store Warranty Included
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                Fast Express Dispatch
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
