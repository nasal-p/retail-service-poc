import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Eye, ArrowRight } from "lucide-react";
import { orderApi } from "../../services/orderApi";
import { formatCurrency, formatDate } from "../../utils/formatters";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { useToast } from "../../hooks/useToast";

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const { showError } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await orderApi.getOrders({ page });
        const data = res?.data || res;
        setOrders(data.results || []);
        setTotalCount(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 20) || 1);
      } catch (err) {
        showError("Failed to retrieve your orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page, showError]);

  if (loading) return <Spinner label="Fetching your order history..." />;

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          My Purchase Orders
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track active orders and review purchase transaction history.
        </p>
      </div>

      {orders.length > 0 ? (
        <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Order Number</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-600">
                      {ord.order_number}
                    </td>
                    <td className="p-4 text-slate-600">{formatDate(ord.created_at)}</td>
                    <td className="p-4 text-slate-700 font-semibold">
                      {ord.item_count || ord.items?.length || 1} item(s)
                    </td>
                    <td className="p-4 font-extrabold text-slate-900">
                      {formatCurrency(ord.total_amount)}
                    </td>
                    <td className="p-4">
                      <Badge variant={getBadgeVariant(ord.order_status)}>
                        {ord.order_status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Link to={`/orders/${ord.id}`}>
                        <Button variant="outline" size="sm" icon={Eye}>
                          View Details
                        </Button>
                      </Link>
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
          icon={Package}
          title="No Orders Found"
          description="You haven't placed any mobile shop orders yet."
          action={
            <Link to="/products">
              <Button variant="primary" icon={ArrowRight}>
                Shop Products Now
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
};

export default CustomerOrdersPage;
