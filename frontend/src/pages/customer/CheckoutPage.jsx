import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  DollarSign,
  CreditCard,
  Smartphone,
  ShieldCheck,
  PackageCheck,
  ArrowRight,
} from "lucide-react";
import { cartApi } from "../../services/cartApi";
import { orderApi } from "../../services/orderApi";
import { formatCurrency } from "../../utils/formatters";
import { PAYMENT_METHODS } from "../../utils/constants";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";

const CheckoutPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const { fetchCartCount } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const res = await cartApi.getCart();
        const data = res?.data || res;
        setCart(data);
      } catch (err) {
        showError("Failed to load cart for checkout.");
      } finally {
        setLoading(false);
      }
    };
    fetchCartData();
  }, [showError]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await orderApi.checkout(paymentMethod, notes);
      const orderData = res?.data || res;

      setCreatedOrder(orderData);
      fetchCartCount();
      showSuccess("Order created successfully!");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.product ||
        "Checkout failed. Please check stock or try again.";
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Preparing checkout..." />;

  // Confirmation View after successful checkout
  if (createdOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center border border-emerald-200/80 shadow-2xl space-y-6 bg-gradient-to-b from-white to-emerald-50/30">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">
              Transaction Approved
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Order Created Successfully
            </h1>
          </div>

          {/* Order Ticket Badge */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs inline-block max-w-md w-full text-left space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-slate-400">Order Number</span>
              <span className="font-mono font-extrabold text-blue-600 text-base">
                {createdOrder.order_number}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Authoritative Total</span>
              <span className="font-bold text-slate-900 text-sm">
                {formatCurrency(createdOrder.total_amount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Payment Status</span>
              <span className="font-bold text-emerald-700 capitalize">
                {createdOrder.payment_status || "Pending"}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your order has been registered in our store queue. Stock has been reserved.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to={`/orders/${createdOrder.id}`}>
              <Button variant="primary" size="lg" icon={PackageCheck}>
                View Order Details
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="outline" size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 text-sm mb-4">Your cart is empty. Nothing to checkout.</p>
        <Link to="/products">
          <Button variant="primary">Shop Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Checkout</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select payment preference and confirm your purchase.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Options & Payment Method */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Method Selector */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200/80 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Select Payment Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm.value;
                return (
                  <label
                    key={pm.value}
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-blue-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={pm.value}
                      checked={isSelected}
                      onChange={() => {}}
                      className="sr-only"
                    />
                    <span className="text-xs font-extrabold mt-1 text-center">{pm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Notes / Special Instructions */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200/80 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Order Notes / Pickup Instructions (Optional)
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Please hold pickup until 5 PM..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Right: Authoritative Order Summary Box */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200/80 space-y-6 h-fit sticky top-24">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Order Review
          </h3>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {items.map((item) => {
              const product = item.product_details || item.product || {};
              return (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div className="truncate max-w-[180px]">
                    <span className="font-semibold text-slate-900 block truncate">
                      {product.name}
                    </span>
                    <span className="text-slate-400 text-[10px]">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(item.subtotal || item.quantity * (product.price || 0))}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium">
              Notice: Final total is calculated authoritatively by the server on order submission.
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              icon={ArrowRight}
              className="flex-row-reverse"
            >
              Place Order
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
