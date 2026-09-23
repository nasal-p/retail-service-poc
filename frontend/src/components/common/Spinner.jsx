import React from "react";

const Spinner = ({ size = "md", label = "Loading...", fullScreen = false }) => {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div
        className={`${
          sizeClasses[size] || sizeClasses.md
        } border-blue-600 border-t-transparent rounded-full animate-spin`}
      />
      {label && <p className="text-sm font-medium text-slate-500 animate-pulse">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xs">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default Spinner;
