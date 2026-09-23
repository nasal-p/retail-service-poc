import React from "react";

const StatCard = ({ title, value, icon: Icon, color = "blue", subtitle }) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <div className="glass-card rounded-2xl p-5 flex items-start justify-between gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {subtitle && <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>}
      </div>

      <div className={`p-3 rounded-xl border ${selectedColor} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

export default StatCard;
