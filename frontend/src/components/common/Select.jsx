import React, { forwardRef } from "react";

const Select = forwardRef(
  (
    {
      label,
      options = [],
      error,
      helperText,
      icon: Icon,
      className = "",
      containerClassName = "",
      placeholder = "Select an option",
      required = false,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none z-10">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <select
            ref={ref}
            className={`w-full appearance-none rounded-xl border bg-white py-2.5 text-sm text-slate-900 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              Icon ? "pl-10 pr-10" : "px-4 pr-10"
            } ${
              error
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-slate-200 hover:border-slate-300 focus:border-blue-500"
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => {
              const value = typeof opt === "object" ? opt.value : opt;
              const label = typeof opt === "object" ? opt.label : opt;
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
          <div className="absolute right-3.5 pointer-events-none text-slate-400">
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        {error ? (
          <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-0.5">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
