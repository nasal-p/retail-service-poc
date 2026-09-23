import React, { useEffect, useState } from "react";
import { ShoppingCart, Eye, Filter, CheckCircle2 } from "lucide-react";
import { orderApi } from "../../services/orderApi";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { ORDER_STATUSES } from "../../utils/constants";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Spinner from "../../components/common/Spinner";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../hooks/useToast";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [updatingId, setUpdatingId] = useState(null);

  const { showSuccess, showError } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getOrders({
        page,
        status: statusFilter || undefined,
      });
      const data = res?.data || res;
      setOrders(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 20) || 1);
    } catch (err) {
      showError("Failed to fetch store orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await orderApi.updateOrderStatus(orderId, newStatus);
      showSuccess(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update order status.";
      showError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const getBadgeVariant = (status) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "PENDING":
        return "warning";
      case "CONFIRMED":
        return "info";
      case "PROCESSING":
        return "primary";
      case "READY_FOR_COLLECTION":
        return "purple";
      case "CANCELLED":
        return "danger";
      default:
        return "info";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Order Processing Management
          </h1>
          <p className="text-xs text-slate-500">
            View customer orders, verify payment, and advance fulfillment statuses.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Select
            placeholder="Filter by Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={ORDER_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
          />
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading order queue..." />
      ) : orders.length > 0 ? (
        <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Order Number</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4">Date Placed</th>
                  <th className="p-4 text-right">Update Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-600">
                      {ord.order_number}
                    </td>

                    <td className="p-4 font-bold text-slate-900">
                      <div>{ord.customer_name || ord.customer?.full_name || "Customer"}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {ord.customer_email || ord.customer?.email}
                      </div>
                    </td>

                    <td className="p-4 font-black text-slate-900">
                      {formatCurrency(ord.total_amount)}
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-slate-700 capitalize">
                        {ord.payment_status} ({ord.payment_method})
                      </span>
                    </td>

                    <td className="p-4">
                      <Badge variant={getBadgeVariant(ord.order_status)}>
                        {ord.order_status}
                      </Badge>
                    </td>

                    <td className="p-4 text-slate-500">{formatDate(ord.created_at)}</td>

                    <td className="p-4 text-right">
                      <select
                        disabled={
                          updatingId === ord.id ||
                          ord.order_status === "COMPLETED" ||
                          ord.order_status === "CANCELLED"
                        }
                        value={ord.order_status}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              count={totalCount}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ShoppingCart}
          title="No Orders Found"
          description="No customer orders match the selected filter."
        />
      )}
    </div>
  );
};

export default AdminOrdersPage;
