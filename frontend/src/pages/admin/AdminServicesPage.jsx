import React, { useEffect, useState } from "react";
import { Wrench, Plus, Edit2, Trash2 } from "lucide-react";
import { serviceApi } from "../../services/serviceApi";
import { formatCurrency } from "../../utils/formatters";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";

const AdminServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    estimated_price: "",
    estimated_duration: "",
    status: "ACTIVE",
  });

  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await serviceApi.getServices();
      const data = res?.data || res || [];
      setServices(data);
    } catch (err) {
      showError("Failed to fetch service offerings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      estimated_price: "",
      estimated_duration: "",
      status: "ACTIVE",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || "",
      description: service.description || "",
      estimated_price: service.estimated_price || "",
      estimated_duration: service.estimated_duration || "",
      status: service.status || "ACTIVE",
    });
    setModalOpen(true);
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate service offering "${name}"?`)) return;
    try {
      await serviceApi.deleteService(id);
      showSuccess(`Service "${name}" deactivated.`);
      fetchServices();
    } catch (err) {
      showError("Failed to deactivate service.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        estimated_price: parseFloat(formData.estimated_price) || 0,
        estimated_duration: formData.estimated_duration,
        status: formData.status,
      };

      if (editingService) {
        await serviceApi.updateService(editingService.id, payload);
        showSuccess("Service updated successfully!");
      } else {
        await serviceApi.createService(payload);
        showSuccess("New repair service offering created!");
      }

      setModalOpen(false);
      fetchServices();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save service.";
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Repair Service Offerings Management
          </h1>
          <p className="text-xs text-slate-500">
            Define service catalog offerings, set turnaround estimates and repair pricing.
          </p>
        </div>

        {user?.role === "ADMIN" && (
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Create Repair Offering
          </Button>
        )}
      </div>

      {loading ? (
        <Spinner label="Loading repair services..." />
      ) : services.length > 0 ? (
        <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Service Name</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Estimated Price</th>
                  <th className="p-4">Turnaround Duration</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((serv) => (
                  <tr key={serv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-blue-500" />
                      {serv.name}
                    </td>

                    <td className="p-4 text-slate-600 max-w-xs truncate">
                      {serv.description || "N/A"}
                    </td>

                    <td className="p-4 font-extrabold text-slate-900">
                      {formatCurrency(serv.estimated_price)}
                    </td>

                    <td className="p-4 text-slate-700 font-medium">
                      {serv.estimated_duration || "1-2 Hours"}
                    </td>

                    <td className="p-4">
                      <Badge variant={serv.status === "ACTIVE" ? "success" : "danger"}>
                        {serv.status}
                      </Badge>
                    </td>

                    <td className="p-4 text-right space-x-2">
                      {user?.role === "ADMIN" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Edit2}
                            onClick={() => handleOpenEdit(serv)}
                          >
                            Edit
                          </Button>
                          {serv.status === "ACTIVE" && (
                            <Button
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => handleDeactivate(serv.id, serv.name)}
                            >
                              Deactivate
                            </Button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Wrench}
          title="No Repair Services Offered"
          description="There are currently no services defined."
        />
      )}

      {/* Service Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? `Edit Service — ${editingService.name}` : "Create Service Offering"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Service Offering Name"
            placeholder="e.g. Screen & Glass Replacement"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Price ($)"
              type="number"
              step="0.01"
              placeholder="120.00"
              value={formData.estimated_price}
              onChange={(e) => setFormData({ ...formData, estimated_price: e.target.value })}
              required
            />

            <Input
              label="Estimated Duration"
              placeholder="e.g. 1-2 Hours, Same Day"
              value={formData.estimated_duration}
              onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
              required
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Service Description
            </label>
            <textarea
              rows="3"
              placeholder="Describe the repair procedure and warranty inclusions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingService ? "Save Changes" : "Create Service Offering"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminServicesPage;
