import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench, Smartphone, User, FileText, Save, Clock, History } from "lucide-react";
import { serviceRequestApi } from "../../services/serviceRequestApi";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { SERVICE_REQUEST_STATUSES, REPAIR_STATUS_STEPS } from "../../utils/constants";
import StatusTimeline from "../../components/customer/StatusTimeline";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../hooks/useToast";

const AdminServiceRequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchTicketDetails = async () => {
    setLoading(true);
    try {
      const [ticketRes, historyRes] = await Promise.all([
        serviceRequestApi.getServiceRequestById(id),
        serviceRequestApi.getHistory(id),
      ]);

      const ticketData = ticketRes?.data || ticketRes;
      const historyData = historyRes?.data || historyRes || [];

      setTicket(ticketData);
      setNewStatus(ticketData.status || "");
      setHistory(historyData);
    } catch (err) {
      showError("Failed to retrieve ticket details.");
      navigate("/admin/service-requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!newStatus || newStatus === ticket.status) return;

    setIsUpdating(true);
    try {
      await serviceRequestApi.updateStatus(id, newStatus, note);
      showSuccess(`Repair ticket status updated to ${newStatus}`);
      setNote("");
      fetchTicketDetails();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update status.";
      showError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <Spinner label="Loading ticket management details..." />;
  if (!ticket) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <Link to="/admin/service-requests">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Back to Ticket Queue
          </Button>
        </Link>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {ticket.ticket_number}
              </h1>
              <Badge variant={ticket.status === "COMPLETED" ? "success" : "info"}>
                {ticket.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Submitted on {formatDate(ticket.created_at)}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Estimated Repair Price</span>
            <span className="text-3xl font-black text-blue-600">
              {formatCurrency(ticket.estimated_price)}
            </span>
          </div>
        </div>

        {/* Timeline Bar */}
        <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Technician Repair Progression
          </h3>
          <StatusTimeline
            currentStatus={ticket.status}
            steps={REPAIR_STATUS_STEPS}
            isCancelled={ticket.status === "CANCELLED"}
          />
        </div>

        {/* Technician Status Update Action Box */}
        <div className="bg-blue-50/60 p-6 rounded-2xl border border-blue-100 space-y-4">
          <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            Update Repair Lifecycle Status
          </h3>

          <form onSubmit={handleUpdateStatus} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <Select
              label="New Repair Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={SERVICE_REQUEST_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            />

            <div className="flex flex-col gap-1.5 sm:col-span-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Technician Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Display screen part arrived..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdating}
              disabled={newStatus === ticket.status}
              icon={Save}
            >
              Update Status
            </Button>
          </form>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
              Customer Profile
            </span>
            <p className="font-bold text-slate-900 text-sm">{ticket.customer_name || ticket.customer?.full_name || "Customer"}</p>
            <p className="text-slate-500">{ticket.customer_email || ticket.customer?.email}</p>
            <p className="text-slate-500">{ticket.customer_phone || ticket.customer?.phone}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
              Device Metadata
            </span>
            <p className="font-bold text-slate-900 text-sm">
              {ticket.device_brand} {ticket.device_model}
            </p>
            <p className="text-slate-500 font-mono">
              Serial: {ticket.serial_number || "None"}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
              Service Request Type
            </span>
            <p className="font-bold text-slate-900 text-sm">{ticket.service_name}</p>
            <p className="text-slate-500">
              Preferred Date: {ticket.preferred_date} @ {ticket.preferred_time}
            </p>
          </div>
        </div>

        {/* Issue Report */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
            Problem Description
          </span>
          <p className="text-xs text-slate-800 font-medium leading-relaxed">
            {ticket.problem_description}
          </p>
        </div>

        {/* Audit History Log */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            Complete Audit Log History
          </h3>
          {history.length > 0 ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Previous Status</th>
                    <th className="p-3.5">New Status</th>
                    <th className="p-3.5">Changed By</th>
                    <th className="p-3.5">Technician Note</th>
                    <th className="p-3.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="p-3.5 text-slate-500 font-medium">{h.old_status || "—"}</td>
                      <td className="p-3.5">
                        <Badge variant="info">{h.new_status}</Badge>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">{h.changed_by_name || "Staff"}</td>
                      <td className="p-3.5 text-slate-600">{h.note || "Standard transition"}</td>
                      <td className="p-3.5 text-right text-slate-500">{formatDate(h.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl">
              No status changes recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminServiceRequestDetailPage;
