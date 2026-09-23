import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, ArrowRight, Plus, Minus, ArrowLeft, Smartphone } from "lucide-react";
import { cartApi } from "../../services/cartApi";
import { formatCurrency, getProductImage } from "../../utils/formatters";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [isClearing, setIsClearing] = useState(false);

  const { isAuthenticated, fetchCartCount } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await cartApi.getCart();
      const cartData = res?.data || res;
      setCart(cartData);
    } catch (err) {
      showError("Failed to load shopping cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const handleUpdateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    setUpdatingId(itemId);
    try {
      const res = await cartApi.updateCartItem(itemId, newQty);
      const updatedCart = res?.data || res;
      setCart(updatedCart);
      fetchCartCount();
      showSuccess("Cart quantity updated.");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.quantity || "Insufficient stock or error.";
      showError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setUpdatingId(itemId);
    try {
      const res = await cartApi.removeCartItem(itemId);
      const updatedCart = res?.data || res;
      setCart(updatedCart);
      fetchCartCount();
      showSuccess("Item removed from cart.");
    } catch (err) {
      showError("Failed to remove item.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your cart?")) return;
    setIsClearing(true);
    try {
      await cartApi.clearCart();
      setCart({ items: [], subtotal: "0.00", total_amount: "0.00" });
      fetchCartCount();
      showSuccess("Cart cleared.");
    } catch (err) {
      showError("Failed to clear cart.");
    } finally {
      setIsClearing(false);
    }
  };

  if (loading) return <Spinner label="Loading cart contents..." />;

  const items = cart?.items || [];
  const subtotal = cart?.total_amount || cart?.subtotal || "0.00";

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <EmptyState
          icon={ShoppingBag}
          title="Log in to view your cart"
          description="Your cart is tied to your account. Please log in or create an account to proceed."
          action={
            <Link to="/login">
              <Button variant="primary">Sign In Now</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Cart is Empty"
          description="Looks like you haven't added any mobile phones or accessories yet."
          action={
            <Link to="/products">
              <Button variant="primary" icon={ArrowLeft}>
                Explore Products
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review your selected products before proceeding to checkout.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={Trash2}
          isLoading={isClearing}
          onClick={handleClearCart}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const product = item.product_details || item.product || {};
            const itemImageUrl = item.product_image || getProductImage({ ...product, image: item.product_image });
            const isItemUpdating = updatingId === item.id;

            return (
              <div
                key={item.id}
                className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200/80"
              >
                {/* Product Info */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/60 p-2">
                    {itemImageUrl ? (
                      <img
                        src={itemImageUrl}
                        alt={item.product_name || product.name}
                        className="w-full h-full object-contain mix-blend-multiply"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=200&q=80"; }}
                      />
                    ) : (
                      <Smartphone className="w-8 h-8 text-slate-400 stroke-1" />
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      {product.brand}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                      <Link to={`/products/${product.id}`} className="hover:text-blue-600">
                        {product.name}
                      </Link>
                    </h3>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {formatCurrency(item.unit_price || product.price)} each
                    </p>
                  </div>
                </div>

                {/* Quantity Controls & Subtotal */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white p-0.5">
                    <button
                      type="button"
                      disabled={isItemUpdating}
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={isItemUpdating}
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Subtotal</span>
                    <span className="font-extrabold text-sm text-slate-900">
                      {formatCurrency(item.subtotal || item.quantity * (product.price || 0))}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isItemUpdating}
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart Summary */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200/80 space-y-6 h-fit sticky top-24">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Order Summary
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Total ({items.length})</span>
              <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated Shipping</span>
              <span className="font-semibold text-emerald-600">Free Store Pickup</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Taxes & Fees</span>
              <span className="font-semibold text-slate-900">Calculated at Checkout</span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="text-sm font-extrabold text-slate-900">Cart Total</span>
              <span className="text-2xl font-black text-blue-600">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>

          <Link to="/checkout" className="block">
            <Button variant="primary" size="lg" fullWidth icon={ArrowRight} className="flex-row-reverse">
              Proceed to Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
