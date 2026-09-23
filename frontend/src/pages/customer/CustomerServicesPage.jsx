import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wrench, Eye, Plus } from "lucide-react";
import { serviceRequestApi } from "../../services/serviceRequestApi";
import { formatDate } from "../../utils/formatters";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { useToast } from "../../hooks/useToast";

const CustomerServicesPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const { showError } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await serviceRequestApi.getServiceRequests({ page });
        const data = res?.data || res;
        setRequests(data.results || []);
        setTotalCount(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 20) || 1);
      } catch (err) {
        showError("Failed to retrieve service tickets.");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [page, showError]);

  if (loading) return <Spinner label="Fetching your repair tickets..." />;

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            My Service Tickets
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track live repair status and service history for your devices.
          </p>
        </div>

        <Link to="/services/book">
          <Button variant="primary" icon={Plus}>
            Book New Repair
          </Button>
        </Link>
      </div>

      {requests.length > 0 ? (
        <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Ticket Number</th>
                  <th className="p-4">Device</th>
                  <th className="p-4">Service Required</th>
                  <th className="p-4">Date Submitted</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-600">
                      {req.ticket_number}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {req.device_brand} {req.device_model}
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {req.service_name || "General Repair"}
                    </td>
                    <td className="p-4 text-slate-600">{formatDate(req.created_at)}</td>
                    <td className="p-4">
                      <Badge variant={getBadgeVariant(req.status)}>{req.status}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Link to={`/services/${req.id}`}>
                        <Button variant="outline" size="sm" icon={Eye}>
                          Track Ticket
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
          icon={Wrench}
          title="No Repair Tickets Found"
          description="You don't have any active or past repair service tickets."
          action={
            <Link to="/services/book">
              <Button variant="primary">Book Your First Repair</Button>
            </Link>
          }
        />
      )}
    </div>
  );
};

export default CustomerServicesPage;
