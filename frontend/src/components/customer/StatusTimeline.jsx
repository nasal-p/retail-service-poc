import React from "react";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatStatusText } from "../../utils/formatters";

const StatusTimeline = ({ currentStatus, steps = [], isCancelled = false }) => {
  if (isCancelled || currentStatus === "CANCELLED") {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
        <div>
          <h4 className="font-bold text-sm">Status: Cancelled</h4>
          <p className="text-xs text-red-600">This request/order has been cancelled.</p>
        </div>
      </div>
    );
  }

  const currentIndex = steps.findIndex(
    (step) => step.toUpperCase() === currentStatus?.toUpperCase()
  );

  return (
    <div className="w-full py-6">
      <div className="relative flex items-center justify-between">
        {/* Background Connector Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />

        {/* Active Connector Line */}
        <div
          className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500"
          style={{
            width: `${
              currentIndex >= 0 && steps.length > 1
                ? (currentIndex / (steps.length - 1)) * 100
                : 0
            }%`,
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div
              key={step}
              className="relative z-10 flex flex-col items-center group cursor-default"
            >
              {/* Step Circle */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm ${
                  isCompleted
                    ? "bg-emerald-600 text-white shadow-emerald-500/20"
                    : isCurrent
                    ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-blue-500/30 scale-110"
                    : "bg-white text-slate-400 border-2 border-slate-300"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4 animate-spin-slow" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <span
                className={`mt-2.5 text-[11px] font-bold text-center max-w-[90px] leading-tight ${
                  isCompleted
                    ? "text-emerald-700 font-semibold"
                    : isCurrent
                    ? "text-blue-600 font-extrabold"
                    : "text-slate-400"
                }`}
              >
                {formatStatusText(step)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTimeline;
