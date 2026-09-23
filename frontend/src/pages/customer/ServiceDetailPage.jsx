import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench, Calendar, Clock, Hash, Smartphone, User, FileText, CheckCircle2 } from "lucide-react";
import { serviceRequestApi } from "../../services/serviceRequestApi";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { REPAIR_STATUS_STEPS } from "../../utils/constants";
import StatusTimeline from "../../components/customer/StatusTimeline";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../hooks/useToast";

const ServiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const { showError } = useToast();

  useEffect(() => {
    const fetchTicketData = async () => {
      setLoading(true);
      try {
        const [ticketRes, historyRes] = await Promise.all([
          serviceRequestApi.getServiceRequestById(id),
          serviceRequestApi.getHistory(id),
        ]);

        const ticketData = ticketRes?.data || ticketRes;
        const historyData = historyRes?.data || historyRes || [];

        setTicket(ticketData);
        setHistory(historyData);
      } catch (err) {
        showError("Failed to load service request details.");
        navigate("/services/my-requests");
      } finally {
        setLoading(false);
      }
    };
    fetchTicketData();
  }, [id, navigate, showError]);

  if (loading) return <Spinner label="Loading ticket timeline..." />;
  if (!ticket) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link to="/services/my-requests">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Back to My Repairs
          </Button>
        </Link>
      </div>

      {/* Main Glass Card */}
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
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Booked on {formatDate(ticket.created_at)}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Estimated Repair Price</span>
            <span className="text-3xl font-black text-blue-600">
              {formatCurrency(ticket.estimated_price)}
            </span>
          </div>
        </div>

        {/* 5-Step Repair Lifecycle Timeline */}
        <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Repair Lifecycle Progress
          </h3>
          <StatusTimeline
            currentStatus={ticket.status}
            steps={REPAIR_STATUS_STEPS}
            isCancelled={ticket.status === "CANCELLED"}
          />
        </div>

        {/* Device & Ticket Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
              Device Details
            </span>
            <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-blue-500" />
              {ticket.device_brand} {ticket.device_model}
            </p>
            <p className="text-slate-500 font-mono">
              Serial / IMEI: {ticket.serial_number || "Not provided"}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
              Requested Service
            </span>
            <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-500" />
              {ticket.service_name || "Device Repair"}
            </p>
            <p className="text-slate-500">
              Turnaround: {ticket.estimated_duration || "1-2 Hours"}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
              Appointment Preference
            </span>
            <p className="font-bold text-slate-900">
              {ticket.preferred_date} at {ticket.preferred_time}
            </p>
            <p className="text-slate-500">101 Tech Avenue Workshop</p>
          </div>
        </div>

        {/* Problem Description Box */}
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-1">
          <span className="text-blue-700 font-bold uppercase tracking-wider block text-[10px] flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            Customer Problem Report
          </span>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {ticket.problem_description}
          </p>
        </div>

        {/* Status Change Audit Trail History */}
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-bold text-slate-900">Status Change Audit History</h3>
          {history.length > 0 ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Previous Status</th>
                    <th className="p-3.5">New Status</th>
                    <th className="p-3.5">Updated By</th>
                    <th className="p-3.5">Notes</th>
                    <th className="p-3.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="p-3.5 text-slate-500 font-medium">
                        {h.old_status || "—"}
                      </td>
                      <td className="p-3.5">
                        <Badge variant="info">{h.new_status}</Badge>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {h.changed_by_name || "Staff"}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {h.note || "Standard status transition"}
                      </td>
                      <td className="p-3.5 text-right text-slate-500">
                        {formatDate(h.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl">
              No status changes logged yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
