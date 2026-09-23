# MobileCare & Retail Management System

[![CI Pipeline](https://github.com/nasal-p/retail-service-poc/actions/workflows/ci.yml/badge.svg)](https://github.com/nasal-p/retail-service-poc/actions)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-4.2+-092E20?style=flat&logo=django&logoColor=white)
![Django REST Framework](https://img.shields.io/badge/DRF-3.15+-red?style=flat)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

> A full-stack retail and device repair management platform built with **Django REST Framework (DRF)** and **React 19**. Features concurrency-safe inventory checkouts, role-based access control (RBAC), end-to-end device service tracking, and automated CI pipelines.

---

### Live Production Links

* **Live Storefront (React SPA)**: [https://retail-service-poc.vercel.app](https://retail-service-poc.vercel.app)
* **Live API Backend (Django DRF)**: [https://mobilecare-api.onrender.com](https://mobilecare-api.onrender.com)
* **Interactive Swagger UI**: [https://mobilecare-api.onrender.com/api/docs/](https://mobilecare-api.onrender.com/api/docs/)

---

## Key Engineering Highlights

* **Atomic Transactions & Concurrency Control**: Checkout logic utilizes database-level row locking (`select_for_update`) and `@transaction.atomic` to prevent race conditions and overselling during peak traffic.
* **Service Layer Architecture**: Clean separation between presentation (`views.py`) and business logic (`services.py`), maintaining thin views and testable domain services.
* **Role-Based Access Control (RBAC)**: Custom JWT-authenticated user system supporting discrete permissions across `CUSTOMER`, `STAFF`, and `ADMIN` roles.
* **Real-time Inventory & Audit Logs**: Automatic low-stock notifications and transactional audit tracking for manual inventory adjustments.
* **Device Repair Lifecycle**: Service ticket generation (`SR-YYYY-XXXXXX`), lifecycle stage management, and spare parts reservation.
* **Automated CI/CD Pipeline**: GitHub Actions workflow running 31 backend unit/integration tests and frontend production builds on every commit.
* **Interactive OpenAPI / Swagger**: Built-in API documentation and schema exploration via `drf-spectacular`.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    React 19 SPA                         │
│   (Vite 8 • TailwindCSS v4 • Lucide Icons • Router v7)  │
└────────────────────────────┬────────────────────────────┘
                             │  HTTP / JSON (REST APIs)
                             │  JWT Bearer Auth
┌────────────────────────────▼────────────────────────────┐
│              Django REST Framework (Python 3.11+)       │
│  ├── accounts  : Custom User & RBAC Auth                │
│  ├── products  : Catalogue, Search & Filtering          │
│  ├── inventory : Stock tracking & Transaction audit     │
│  ├── orders    : Atomic Checkout, Cart & Invoicing      │
│  └── services  : Repair booking & Lifecycle engine      │
└────────────────────────────┬────────────────────────────┘
                             │  ORM Transactions
┌────────────────────────────▼────────────────────────────┐
│             Database (PostgreSQL / SQLite)              │
└─────────────────────────────────────────────────────────┘
```

---

## Repository Layout

```text
├── .github/
│   └── workflows/
│       └── ci.yml             # Automated CI pipeline (Tests + Lint + Build)
├── backend/
│   ├── apps/
│   │   ├── accounts/          # User auth, RBAC & profile management
│   │   ├── products/          # Products, categories, and filtering
│   │   ├── inventory/         # Stock control & transaction logging
│   │   ├── orders/            # Cart & atomic checkout services
│   │   └── services/          # Repair ticket lifecycle management
│   ├── config/                # Modular Django settings (base, dev, prod)
│   ├── core/                  # Shared permissions, pagination, responses
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React context providers (Auth, Cart)
│   │   ├── pages/             # Customer & Admin pages
│   │   ├── services/          # Axios API clients
│   │   └── routes/            # Protected & public route definitions
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Quickstart Guide

### 1. Prerequisites
* **Python 3.11+**
* **Node.js 20+** and **npm**
* **Git**

---

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create and activate a virtual environment
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations & seed sample data (includes 3 demo accounts)
python manage.py migrate
python manage.py seed_data

# Run automated tests (31 test cases)
python manage.py test

# Start the Django server
python manage.py runserver
```
The API server will run at: `http://127.0.0.1:8000/`  
Interactive Swagger Docs: `http://127.0.0.1:8000/api/docs/`

---

### 3. Frontend Setup

In a new terminal window:

```bash
# Navigate to frontend folder
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
The application will be accessible at: `http://localhost:5173/`

---

## Demo Credentials

After running `python manage.py seed_data`, the following pre-configured test accounts are available:

| Role | Email | Password | Permissions / Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@mobilecenter.com` | `Admin123!` | Full access to dashboard, inventory, repair management |
| **Staff** | `staff@mobilecenter.com` | `Staff123!` | Order fulfillment & service status tracking |
| **Customer** | `customer@mobilecenter.com` | `Customer123!` | Storefront browsing, shopping cart, repair booking |

---

## Testing & Code Quality

The backend test suite verifies transaction atomicity, stock reservation bounds, authentication boundaries, and permission isolation:

```bash
cd backend
python manage.py test
```

Expected output:
```text
Found 31 test(s).
Creating test database for alias 'default'...
...............................
----------------------------------------------------------------------
Ran 31 tests in ~3.5s

OK
```

Frontend production verification:
```bash
cd frontend
npm run lint
npm run build
```

---

## License
Distributed under the MIT License. See `LICENSE` for details.
