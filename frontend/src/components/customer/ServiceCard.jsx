import React from "react";
import { Link } from "react-router-dom";
import { Clock, ShieldCheck, ArrowRight, Wrench } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";
import Button from "../common/Button";

const ServiceCard = ({ service }) => {
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300">
      <div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <Wrench className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{service.name}</h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          {service.description || "Professional certified repair service with genuine replacement parts."}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-100 space-y-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
              Estimated Price
            </span>
            <span className="font-extrabold text-slate-900 text-sm">
              {formatCurrency(service.estimated_price)}
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
              Turnaround Time
            </span>
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              {service.estimated_duration || "1-2 Hours"}
            </span>
          </div>
        </div>

        <Link to={`/services/book?service=${service.id}`} className="block">
          <Button variant="primary" fullWidth icon={ArrowRight} className="flex-row-reverse">
            Book Service
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ServiceCard;
