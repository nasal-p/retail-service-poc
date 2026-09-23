import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (path) => {
    if (path.includes("/admin/dashboard")) return "Admin Dashboard Overview";
    if (path.includes("/admin/products/create")) return "Add New Product";
    if (path.includes("/admin/products")) return "Product Management Catalogue";
    if (path.includes("/admin/inventory")) return "Inventory & Stock Control";
    if (path.includes("/admin/orders")) return "Order Management";
    if (path.includes("/admin/services")) return "Repair Service Offerings";
    if (path.includes("/admin/service-requests")) return "Service Tickets & Repair Tracking";
    if (path.includes("/admin/users")) return "User Accounts & Role Management";
    return "Management Dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <AdminHeader
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title={getPageTitle(location.pathname)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
