import React from "react";
import { PackageX } from "lucide-react";

const EmptyState = ({
  icon: Icon = PackageX,
  title = "No data found",
  description = "There are no records matching your request right now.",
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 my-6">
      <div className="p-4 bg-white rounded-full shadow-sm text-slate-400 mb-4 border border-slate-100">
        <Icon className="w-10 h-10" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
