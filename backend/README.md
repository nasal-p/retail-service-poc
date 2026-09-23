# Retail Mobile Shop & Service Management System — PoC Backend

A production-style Django REST Framework API for a retail mobile shop with integrated device repair/service management.

Designed with an API-first approach to serve web (React) and mobile frontends.

---

##  Key Features

* **Role-Based Access Control (RBAC)**: Custom `CustomUser` model supporting `CUSTOMER`, `STAFF`, and `ADMIN` roles.
* **Authentication**: JWT token authentication (access & refresh tokens) powered by `djangorestframework-simplejwt`.
* **Product Catalogue & Filtering**: Paginated product listing with full-text search (name, brand, model, SKU) and filtering by category, price range, and stock status.
* **Inventory Management**: Real-time stock tracking with low-stock thresholds, manual admin stock adjustments, and full transaction history audit logging.
* **Shopping Cart & Atomic Checkout**: Customer shopping cart with server-side calculation and concurrency-safe, database-transactional checkout (`select_for_update()`).
* **Device Repair & Service Management**: Service catalogue booking, ticket number generation, lifecycle status tracking state machine, status change audit trail, and required spare parts reservation.
* **Admin Dashboard**: Aggregated real-time metrics (sales, active repairs, low stock count, customer metrics).
* **OpenAPI Documentation**: Interactive Swagger UI generated via `drf-spectacular`.

---

##  Technology Stack

* **Language**: Python 3.11+
* **Framework**: Django 4.2+, Django REST Framework 3.15+
* **Database**: PostgreSQL / SQLite (fallback for local development)
* **Authentication**: SimpleJWT (`rest_framework_simplejwt`)
* **API Documentation**: OpenAPI 3.0 / Swagger (`drf-spectacular`)
* **CORS**: `django-cors-headers`

---

##  Architecture & App Structure

```text
backend/
├── config/                  # Core project configuration & settings
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py   # Development configuration (SQLite fallback)
│   │   └── production.py    # Production configuration (PostgreSQL)
│   ├── urls.py              # Root URL routing & Swagger mounts
│   ├── wsgi.py
│   └── asgi.py
│
├── core/                    # Shared infrastructure
│   ├── permissions.py       # Custom DRF permission classes (IsAdmin, IsStaff, etc.)
│   ├── pagination.py        # Standard paginator (PageNumberPagination)
│   └── responses.py         # Standardized API response wrappers
│
└── apps/
    ├── accounts/            # User authentication, RBAC, profile & dashboard
    ├── products/            # Category & Product catalogue + search/filters
    ├── inventory/           # Stock control, thresholds, and transaction history
    ├── orders/              # Cart management, atomic checkout & order processing
    └── services/            # Repair service booking & status lifecycle management
```

---

##  Quickstart & Setup Guide

### 1. Environment Setup

Clone the repository and navigate into the `backend/` directory:

```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default local `.env` settings use SQLite and development mode:

```env
SECRET_KEY=django-insecure-local-dev-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 4. Run Migrations & Seed Initial Data

```bash
python manage.py migrate
python manage.py seed_data
```

The `seed_data` command initializes sample data and 3 default user accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@mobilecenter.com` | `Admin123!` |
| **Staff** | `staff@mobilecenter.com` | `Staff123!` |
| **Customer** | `customer@mobilecenter.com` | `Customer123!` |

### 5. Start the Development Server

```bash
python manage.py runserver
```

The API server will run at `http://127.0.0.1:8000/`.

---

##  API Documentation & Swagger UI

Once the server is running, open your browser and navigate to:

* **Interactive Swagger UI**: [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
* **OpenAPI Schema (JSON)**: [http://127.0.0.1:8000/api/schema/](http://127.0.0.1:8000/api/schema/)

---

##  Running Unit & Integration Tests

Run the complete automated test suite (31 tests covering all apps):

```bash
python manage.py test
```

---

##  API Endpoint Summary

### Authentication (`/api/auth/`)
* `POST /api/auth/register/` — Register new customer account
* `POST /api/auth/login/` — Authenticate user and acquire JWT access/refresh tokens
* `POST /api/auth/refresh/` — Refresh access token
* `GET  /api/auth/me/` — Retrieve authenticated user profile

### Products (`/api/`)
* `GET  /api/categories/` — List product categories
* `POST /api/categories/` — Create category (Admin)
* `GET  /api/products/` — List active products (supports `?search=`, `?category=`, `?min_price=`, `?in_stock=`)
* `POST /api/products/` — Create product (Admin)
* `GET  /api/products/{id}/` — Retrieve product details
* `PATCH /api/products/{id}/` — Update product details (Admin)

### Inventory (`/api/inventory/`)
* `GET  /api/inventory/` — List stock levels (Staff/Admin, supports `?low_stock=true`)
* `GET  /api/inventory/{product_id}/` — Retrieve product inventory details
* `POST /api/inventory/{product_id}/adjust/` — Manually adjust stock (Admin)
* `GET  /api/inventory/{product_id}/transactions/` — View stock transaction history

### Cart & Orders (`/api/`)
* `GET    /api/cart/` — Get customer cart with calculated totals
* `POST   /api/cart/items/` — Add product to cart
* `PATCH  /api/cart/items/{id}/` — Update cart item quantity
* `DELETE /api/cart/items/{id}/` — Remove item from cart
* `DELETE /api/cart/clear/` — Clear cart
* `POST   /api/orders/checkout/` — Atomic checkout (converts cart into Order + deducts stock)
* `GET    /api/orders/` — List orders (Customers see own orders; Staff/Admin see all)
* `GET    /api/orders/{id}/` — Retrieve order details
* `PATCH  /api/orders/{id}/status/` — Update order status (Staff/Admin)

### Repair Services (`/api/`)
* `GET   /api/services/` — List service catalogue
* `POST  /api/services/` — Add new service offering (Admin)
* `GET   /api/service-requests/` — List repair requests
* `POST  /api/service-requests/` — Book a service request (Customer)
* `GET   /api/service-requests/{id}/` — Retrieve service request details
* `PATCH /api/service-requests/{id}/status/` — Update repair status with notes (Staff/Admin)
* `GET   /api/service-requests/{id}/history/` — View status change audit log

### Admin Dashboard (`/api/dashboard/`)
* `GET  /api/dashboard/` — Aggregated shop performance metrics & recent activity (Admin)
