import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileSpreadsheet, Eye } from "lucide-react";
import { serviceRequestApi } from "../../services/serviceRequestApi";
import { formatDate } from "../../utils/formatters";
import { SERVICE_REQUEST_STATUSES } from "../../utils/constants";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Spinner from "../../components/common/Spinner";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../hooks/useToast";

const AdminServiceRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const { showError } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await serviceRequestApi.getServiceRequests({
        page,
        status: statusFilter || undefined,
      });
      const data = res?.data || res;
      setRequests(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 20) || 1);
    } catch (err) {
      showError("Failed to fetch service repair tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const getBadgeVariant = (status) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "RECEIVED":
        return "info";
      case "DIAGNOSING":
        return "warning";
      case "WAITING_FOR_PARTS":
        return "orange";
      case "IN_REPAIR":
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
            Repair Service Requests & Tickets
          </h1>
          <p className="text-xs text-slate-500">
            Manage incoming repair bookings, update ticket lifecycle statuses, and log technician notes.
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
            options={SERVICE_REQUEST_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
          />
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading repair tickets..." />
      ) : requests.length > 0 ? (
        <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Ticket Number</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Device Model</th>
                  <th className="p-4">Required Service</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4">Date Booked</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((sr) => (
                  <tr key={sr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-600">
                      <Link to={`/admin/service-requests/${sr.id}`}>{sr.ticket_number}</Link>
                    </td>

                    <td className="p-4 font-bold text-slate-900">
                      <div>{sr.customer_name || sr.customer?.full_name || "Customer"}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {sr.customer_email || sr.customer?.email}
                      </div>
                    </td>

                    <td className="p-4 font-semibold text-slate-800">
                      {sr.device_brand} {sr.device_model}
                    </td>

                    <td className="p-4 text-slate-700 font-medium">{sr.service_name}</td>

                    <td className="p-4">
                      <Badge variant={getBadgeVariant(sr.status)}>{sr.status}</Badge>
                    </td>

                    <td className="p-4 text-slate-500">{formatDate(sr.created_at)}</td>

                    <td className="p-4 text-right">
                      <Link to={`/admin/service-requests/${sr.id}`}>
                        <Button variant="outline" size="sm" icon={Eye}>
                          Manage Ticket
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
          icon={FileSpreadsheet}
          title="No Service Tickets Found"
          description="No repair tickets match the selected status filter."
        />
      )}
    </div>
  );
};

export default AdminServiceRequestsPage;
