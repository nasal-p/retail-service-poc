import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, CreditCard, Calendar, Smartphone } from "lucide-react";
import { orderApi } from "../../services/orderApi";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { ORDER_STATUS_STEPS } from "../../utils/constants";
import StatusTimeline from "../../components/customer/StatusTimeline";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../hooks/useToast";

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const { showError } = useToast();

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await orderApi.getOrderById(id);
        const data = res?.data || res;
        setOrder(data);
      } catch (err) {
        showError("Order details could not be loaded.");
        navigate("/orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, navigate, showError]);

  if (loading) return <Spinner label="Retrieving order details..." />;
  if (!order) return null;

  const items = order.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link to="/orders">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Back to My Orders
          </Button>
        </Link>
      </div>

      {/* Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {order.order_number}
              </h1>
              <Badge variant={order.order_status === "COMPLETED" ? "success" : "info"}>
                {order.order_status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Placed on {formatDate(order.created_at)}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Authoritative Order Total</span>
            <span className="text-3xl font-black text-blue-600">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Order Delivery Progress
          </h3>
          <StatusTimeline
            currentStatus={order.order_status}
            steps={ORDER_STATUS_STEPS}
            isCancelled={order.order_status === "CANCELLED"}
          />
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
              Payment Details
            </span>
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-500" />
              {order.payment_method}
            </p>
            <p className="text-slate-500">
              Status: <span className="font-semibold text-slate-900">{order.payment_status}</span>
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
              Customer Information
            </span>
            <p className="font-bold text-slate-800">{order.customer_name || order.customer?.full_name || "Customer"}</p>
            <p className="text-slate-500">{order.customer_email || order.customer?.email}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
              Fulfillment Method
            </span>
            <p className="font-bold text-slate-800">In-Store Pickup / Dispatch</p>
            <p className="text-slate-500">101 Tech Avenue Store</p>
          </div>
        </div>

        {/* Ordered Products Table */}
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-bold text-slate-900">Purchased Products ({items.length})</h3>
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5 text-center">Unit Price</th>
                  <th className="p-3.5 text-center">Quantity</th>
                  <th className="p-3.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="p-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{it.product_name}</span>
                        <span className="text-[10px] text-slate-400">SKU: {it.product_sku || "N/A"}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-center font-medium text-slate-700">
                      {formatCurrency(it.unit_price)}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-900">
                      {it.quantity}
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-slate-900">
                      {formatCurrency(it.subtotal || it.unit_price * it.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
