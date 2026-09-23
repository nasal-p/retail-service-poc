import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  Clock,
  Users,
  Wrench,
  CheckCircle2,
  Eye,
  ArrowRight,
} from "lucide-react";
import { dashboardApi } from "../../services/dashboardApi";
import { formatCurrency, formatDate } from "../../utils/formatters";
import StatCard from "../../components/admin/StatCard";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../hooks/useToast";

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { showError } = useToast();

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await dashboardApi.getDashboardStats();
        const statsData = res?.data || res;
        setData(statsData);
      } catch (err) {
        showError("Failed to load dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [showError]);

  if (loading) return <Spinner label="Loading aggregated metrics..." />;
  if (!data) return null;

  const stats = data.stats || {};
  const recentOrders = data.recent_orders || [];
  const recentRequests = data.recent_service_requests || [];

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Products"
          value={stats.total_products || 0}
          icon={Package}
          color="blue"
          subtitle="Active items in store catalogue"
        />

        <StatCard
          title="Low Stock Warning"
          value={stats.low_stock_products || 0}
          icon={AlertTriangle}
          color="rose"
          subtitle="Items at or below stock threshold"
        />

        <StatCard
          title="Today's Orders"
          value={stats.today_orders || 0}
          icon={ShoppingCart}
          color="emerald"
          subtitle="New purchases created today"
        />

        <StatCard
          title="Pending Orders"
          value={stats.pending_orders || 0}
          icon={Clock}
          color="amber"
          subtitle="Orders awaiting processing"
        />

        <StatCard
          title="Registered Customers"
          value={stats.total_customers || 0}
          icon={Users}
          color="purple"
          subtitle="Active customer accounts"
        />

        <StatCard
          title="Active Repairs"
          value={stats.active_service_requests || 0}
          icon={Wrench}
          color="cyan"
          subtitle="Services in progress or diagnosis"
        />

        <StatCard
          title="Completed Repairs"
          value={stats.completed_services || 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Finished repair tickets"
        />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              Recent Orders
            </h3>
            <Link to="/admin/orders">
              <Button variant="ghost" size="sm" icon={ArrowRight} className="flex-row-reverse">
                View All
              </Button>
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Order</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-blue-600">
                        <Link to={`/admin/orders`}>{ord.order_number}</Link>
                      </td>
                      <td className="p-3 font-semibold text-slate-800 truncate max-w-[120px]">
                        {ord.customer_name || ord.customer?.full_name || "Customer"}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {formatCurrency(ord.total_amount)}
                      </td>
                      <td className="p-3">
                        <Badge variant="info">{ord.order_status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-4 text-center">No recent orders.</p>
          )}
        </div>

        {/* Recent Service Requests */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              Recent Service Requests
            </h3>
            <Link to="/admin/service-requests">
              <Button variant="ghost" size="sm" icon={ArrowRight} className="flex-row-reverse">
                View All
              </Button>
            </Link>
          </div>

          {recentRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Ticket</th>
                    <th className="p-3">Device</th>
                    <th className="p-3">Service</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRequests.map((sr) => (
                    <tr key={sr.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-blue-600">
                        <Link to={`/admin/service-requests/${sr.id}`}>{sr.ticket_number}</Link>
                      </td>
                      <td className="p-3 font-bold text-slate-900 truncate max-w-[110px]">
                        {sr.device_brand} {sr.device_model}
                      </td>
                      <td className="p-3 text-slate-600 truncate max-w-[120px]">
                        {sr.service_name}
                      </td>
                      <td className="p-3">
                        <Badge variant="purple">{sr.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-4 text-center">
              No recent service tickets.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
