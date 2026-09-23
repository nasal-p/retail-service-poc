# Retail Mobile Shop & Service Management System — React Frontend PoC

A modern, responsive React + Vite frontend for a **Retail Mobile Shop & Service Management System**, communicating with the Django REST Framework API backend.

---

## 🌟 Features

* **Role-Based Access Control (RBAC)**: Role routing for `CUSTOMER`, `STAFF`, and `ADMIN`.
* **JWT Authentication**: Auto token injection & seamless token refresh on 401 expiration.
* **Retail Shop & Cart**: Product filtering, search, live stock validation, cart management, and atomic checkout.
* **Service Booking & Tracking**: Book repair services and track repair progression across 5 lifecycle steps with full audit trail history logs.
* **Admin & Staff Management**: Metrics dashboard, product CRUD, inventory threshold monitoring, stock adjustments, order processing, and user administration.
* **Modern Aesthetic UI**: Vibrant dark/light elements, glassmorphism, responsive tables, badge statuses, toast notifications, and zero mock data dependencies.

---

## 🚀 Quickstart & Setup

### 1. Requirements

* Node.js v18+
* Running Django REST API backend at `http://127.0.0.1:8000/api`

### 2. Environment Configuration

Create a `.env` file in the `frontend/` directory (or copy `.env.example`):

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The application will run at `http://localhost:5173`.

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@mobilecenter.com` | `Customer123!` | Products, Cart, Checkout, Repair Booking, Orders & Repair Tracking |
| **Staff** | `staff@mobilecenter.com` | `Staff123!` | Inventory, Orders Management, Service Requests Management |
| **Admin** | `admin@mobilecenter.com` | `Admin123!` | Full Access (Dashboard, Product CRUD, Inventory, Users) |

---

## 📁 Project Structure

```text
frontend/
├── src/
│   ├── assets/              # Branding and icons
│   ├── components/          # Reusable UI, Customer, and Admin components
│   ├── context/             # AuthContext (JWT & profile), ToastContext
│   ├── hooks/               # useAuth, useToast
│   ├── layouts/             # CustomerLayout, AdminLayout
│   ├── pages/               # Auth, Customer, and Admin page views
│   ├── routes/              # AppRoutes, ProtectedRoute, RoleProtectedRoute, PublicRoute
│   ├── services/            # Axios API modules (auth, products, cart, orders, services, inventory, dashboard)
│   ├── utils/               # Formatters, constants, storage helpers
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── package.json
└── README.md
```
