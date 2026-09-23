import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Spinner from "../components/common/Spinner";

const RoleProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Spinner fullScreen label="Checking authorization..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    // Redirect unauthorized user according to their role
    if (user?.role === "CUSTOMER") {
      return <Navigate to="/products" replace />;
    } else if (user?.role === "STAFF") {
      return <Navigate to="/admin/orders" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
