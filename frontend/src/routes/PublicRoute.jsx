import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const PublicRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    if (user.role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === "STAFF") {
      return <Navigate to="/admin/orders" replace />;
    } else {
      return <Navigate to="/products" replace />;
    }
  }

  return children;
};

export default PublicRoute;
