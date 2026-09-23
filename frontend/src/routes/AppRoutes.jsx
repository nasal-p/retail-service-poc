import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import CustomerLayout from "../layouts/CustomerLayout";
import AdminLayout from "../layouts/AdminLayout";

// Route Guards
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";

// Auth Pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

// Customer Pages
import HomePage from "../pages/customer/HomePage";
import ProductsPage from "../pages/customer/ProductsPage";
import ProductDetailPage from "../pages/customer/ProductDetailPage";
import CartPage from "../pages/customer/CartPage";
import CheckoutPage from "../pages/customer/CheckoutPage";
import CustomerOrdersPage from "../pages/customer/CustomerOrdersPage";
import OrderDetailPage from "../pages/customer/OrderDetailPage";
import ServicesPage from "../pages/customer/ServicesPage";
import BookServicePage from "../pages/customer/BookServicePage";
import CustomerServicesPage from "../pages/customer/CustomerServicesPage";
import ServiceDetailPage from "../pages/customer/ServiceDetailPage";
import ProfilePage from "../pages/customer/ProfilePage";

// Admin / Staff Pages
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminProductsPage from "../pages/admin/AdminProductsPage";
import AdminProductFormPage from "../pages/admin/AdminProductFormPage";
import AdminInventoryPage from "../pages/admin/AdminInventoryPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";
import AdminServicesPage from "../pages/admin/AdminServicesPage";
import AdminServiceRequestsPage from "../pages/admin/AdminServiceRequestsPage";
import AdminServiceRequestDetailPage from "../pages/admin/AdminServiceRequestDetailPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Customer Facing Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/services" element={<ServicesPage />} />

        {/* Protected Customer Routes */}
        <Route
          path="/checkout"
          element={
            <RoleProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CheckoutPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <RoleProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerOrdersPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services/book"
          element={
            <RoleProtectedRoute allowedRoles={["CUSTOMER"]}>
              <BookServicePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/services/my-requests"
          element={
            <RoleProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerServicesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/services/:id"
          element={
            <ProtectedRoute>
              <ServiceDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin / Staff Dashboard Routes */}
      <Route
        path="/admin"
        element={
          <RoleProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
            <AdminLayout />
          </RoleProtectedRoute>
        }
      >
        <Route
          path="dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboardPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="products"
          element={
            <RoleProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminProductsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="products/create"
          element={
            <RoleProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminProductFormPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="products/:id/edit"
          element={
            <RoleProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminProductFormPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="inventory"
          element={
            <RoleProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
              <AdminInventoryPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <RoleProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
              <AdminOrdersPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="services"
          element={
            <RoleProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
              <AdminServicesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="service-requests"
          element={
            <RoleProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
              <AdminServiceRequestsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="service-requests/:id"
          element={
            <RoleProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
              <AdminServiceRequestDetailPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <RoleProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminUsersPage />
            </RoleProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
