import React from "react";

const Card = ({ children, className = "", hover = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-2xl p-5 transition-all duration-200 ${
        hover
          ? "hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 cursor-pointer"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
