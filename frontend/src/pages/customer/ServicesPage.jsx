import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wrench, ShieldCheck, Clock, Plus, ArrowRight } from "lucide-react";
import { serviceApi } from "../../services/serviceApi";
import ServiceCard from "../../components/customer/ServiceCard";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../hooks/useToast";

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const { showError } = useToast();

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await serviceApi.getServices();
        const data = res?.data || res || [];
        setServices(data);
      } catch (err) {
        showError("Failed to load service catalogue.");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [showError]);

  if (loading) return <Spinner label="Loading service catalogue..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
            Certified Repair Center
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Mobile Service Catalogue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Professional device repairs using genuine parts with certified technician warranty.
          </p>
        </div>

        <Link to="/services/book">
          <Button variant="primary" icon={Plus}>
            Book a Custom Repair
          </Button>
        </Link>
      </div>

      {/* Services Grid */}
      {services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((serv) => (
            <ServiceCard key={serv.id} service={serv} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Wrench}
          title="No Repair Services Listed"
          description="There are currently no repair service offerings listed in the catalogue."
        />
      )}
    </div>
  );
};

export default ServicesPage;
