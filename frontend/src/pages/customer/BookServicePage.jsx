import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  Wrench,
  Smartphone,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
  Hash,
} from "lucide-react";
import { serviceApi } from "../../services/serviceApi";
import { serviceRequestApi } from "../../services/serviceRequestApi";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";

const BookServicePage = () => {
  const [searchParams] = useSearchParams();
  const initialServiceId = searchParams.get("service") || "";

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [formData, setFormData] = useState({
    service: initialServiceId,
    device_brand: "",
    device_model: "",
    serial_number: "",
    problem_description: "",
    preferred_date: new Date().toISOString().split("T")[0],
    preferred_time: "10:00:00",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);

  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await serviceApi.getServices();
        const data = res?.data || res || [];
        setServices(data);
        if (initialServiceId && !formData.service) {
          setFormData((prev) => ({ ...prev, service: initialServiceId }));
        }
      } catch (err) {
        showError("Failed to load services list.");
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, [initialServiceId, showError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showError("Please log in to book a repair service.");
      navigate("/login");
      return;
    }
    if (user?.role !== "CUSTOMER") {
      showError("Only customers can submit repair booking requests.");
      return;
    }

    if (!formData.service) {
      setErrors((prev) => ({ ...prev, service: "Please select a repair service." }));
      return;
    }
    if (!formData.device_brand.trim()) {
      setErrors((prev) => ({ ...prev, device_brand: "Device brand is required." }));
      return;
    }
    if (!formData.device_model.trim()) {
      setErrors((prev) => ({ ...prev, device_model: "Device model is required." }));
      return;
    }
    if (!formData.problem_description.trim()) {
      setErrors((prev) => ({
        ...prev,
        problem_description: "Please describe the problem with your device.",
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await serviceRequestApi.bookService({
        service: parseInt(formData.service),
        device_brand: formData.device_brand,
        device_model: formData.device_model,
        serial_number: formData.serial_number || undefined,
        problem_description: formData.problem_description,
        preferred_date: formData.preferred_date,
        preferred_time: formData.preferred_time,
      });

      const ticketData = res?.data || res;
      setCreatedTicket(ticketData);
      showSuccess("Service ticket created successfully!");
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (backendErrors && typeof backendErrors === "object") {
        setErrors(backendErrors);
      } else {
        const msg = err.response?.data?.message || err.message || "Failed to book service.";
        showError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingServices) return <Spinner label="Preparing booking form..." />;

  // Confirmation view after booking
  if (createdTicket) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center border border-blue-200/80 shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
              Booking Confirmed
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Service Request Created
            </h1>
          </div>

          {/* Ticket Information Card */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 inline-block max-w-md w-full text-left space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
              <span className="text-xs font-semibold text-slate-500">Ticket Number</span>
              <span className="font-mono font-black text-blue-600 text-lg">
                {createdTicket.ticket_number}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Device</span>
              <span className="font-bold text-slate-900">
                {createdTicket.device_brand} {createdTicket.device_model}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Status</span>
              <span className="font-bold text-blue-600 uppercase px-2 py-0.5 bg-blue-50 rounded-md border border-blue-200">
                {createdTicket.status || "Received"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Estimated Price</span>
              <span className="font-extrabold text-slate-900">
                ${createdTicket.estimated_price || "TBD"}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Our certified repair technicians have received your request. You can monitor progress and status updates anytime.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to={`/services/${createdTicket.id}`}>
              <Button variant="primary" size="lg" icon={ArrowRight} className="flex-row-reverse">
                Track Ticket Status
              </Button>
            </Link>
            <Link to="/services/my-requests">
              <Button variant="outline" size="lg">
                View All My Requests
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Book a Repair Service
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Fill out your device details and issue description to generate an official repair ticket.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Select Service */}
          <Select
            label="Service Offering"
            name="service"
            value={formData.service}
            onChange={handleChange}
            error={errors.service}
            icon={Wrench}
            required
            options={services.map((s) => ({
              value: s.id,
              label: `${s.name} — $${s.estimated_price} (${s.estimated_duration || "1-2 Hours"})`,
            }))}
            placeholder="Select a repair service..."
          />

          {/* Device Brand & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Device Brand"
              name="device_brand"
              placeholder="e.g. Apple, Samsung, Google"
              icon={Smartphone}
              value={formData.device_brand}
              onChange={handleChange}
              error={errors.device_brand}
              required
            />

            <Input
              label="Device Model"
              name="device_model"
              placeholder="e.g. iPhone 17 Pro, Galaxy S25"
              icon={Smartphone}
              value={formData.device_model}
              onChange={handleChange}
              error={errors.device_model}
              required
            />
          </div>

          {/* Serial Number */}
          <Input
            label="Serial Number / IMEI (Optional)"
            name="serial_number"
            placeholder="e.g. SN-99887766"
            icon={Hash}
            value={formData.serial_number}
            onChange={handleChange}
            error={errors.serial_number}
            helperText="Provides faster warranty validation"
          />

          {/* Problem Description */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Problem Description <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              name="problem_description"
              rows="4"
              placeholder="Describe the issue (e.g., Cracked front screen, touch display unresponsive, battery drains quickly...)"
              value={formData.problem_description}
              onChange={handleChange}
              className={`w-full rounded-xl border bg-white p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.problem_description ? "border-red-500" : "border-slate-200"
              }`}
            />
            {errors.problem_description && (
              <p className="text-xs text-red-500 font-medium">{errors.problem_description}</p>
            )}
          </div>

          {/* Preferred Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Preferred Appointment Date"
              type="date"
              name="preferred_date"
              icon={Calendar}
              value={formData.preferred_date}
              onChange={handleChange}
              error={errors.preferred_date}
              required
            />

            <Input
              label="Preferred Time"
              type="time"
              name="preferred_time"
              icon={Clock}
              value={formData.preferred_time}
              onChange={handleChange}
              error={errors.preferred_time}
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              icon={FileText}
            >
              Submit Repair Booking Ticket
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookServicePage;
