# Fonu Take-Home Task: Inventory & Orders Service

## 🏗️ Architecture & Trade-offs
- **NestJS & Prisma:** Chosen for rapid development, built-in validation pipes, and transactional guarantees when processing orders against current inventory stock. All order placements are wrapped in an interactive Prisma PostgreSQL transaction (`prisma.$transaction`) executing atomic stock decrements (`decrement: quantity`) to prevent race conditions and overselling.
- **Go Microservice:** Offloaded analytics querying to Go because it excels at lightweight, fast CPU/IO tasks, preventing heavy data-crunching queries from blocking the main user-facing NestJS event loop. The Go service executes a single, zero-lock Common Table Expression (CTE) raw SQL query that calculates total revenue, total order count, and the top-selling product in one round-trip.
- **State Management:** Handled natively via local/context state to minimize package dependencies for a lean bundle footprint. React Context manages JWT session persistence and role hydration, while component state handles optimistic UI updates and live cart tallies.

---

##  Repository Structure
```text
├── backend/            # NestJS + TypeScript + Prisma + PostgreSQL
│   ├── prisma/         # Prisma schema, migrations, and seed script
│   ├── src/
│   │   ├── auth/       # JWT auth, @Roles() decorator, RolesGuard (RBAC)
│   │   ├── products/   # Product CRUD with Admin-only mutations
│   │   ├── orders/     # Transactional order placement & role-scoped ledger
│   │   └── analytics/  # HttpModule bridge to Go reporting microservice
│   └── test/           # Jest unit & integration test suites
├── frontend/           # React 18 + TypeScript + Vite + Tailwind CSS
│   └── src/
│       ├── components/ # CustomerDashboard, AdminDashboard, AuthModal, Navbar
│       ├── context/    # AuthContext with 1-click reviewer presets
│       └── services/   # Typed API client with token injection & error mapping
├── microservice/       # Golang (net/http, database/sql, github.com/lib/pq)
│   ├── main.go         # Optimized analytics microservice with raw CTE query
│   └── go.mod          # Go module configuration
├── docker-compose.yml  # PostgreSQL 16 container setup
└── README.md           # Documentation & architectural decisions
```

---

## 🚀 Setup Instructions

### 1. Database Setup (Docker)
Ensure Docker is installed, then boot up PostgreSQL:
```bash
docker-compose up -d
```
*PostgreSQL will be running on `localhost:5432` with database `fonu_db` (user: `postgres`, password: `postgres`).*

---

### 2. Backend (NestJS)
In a new terminal window:
```bash
cd backend
npm install
npx prisma migrate dev
npm run prisma:seed   # Seeds default admin, customer, and catalog products
npm run start:dev
```
*NestJS API will run on **http://localhost:3000**.*

To execute the Jest integration test suite for the order placement and RBAC flow:
```bash
npm run test
```

---

### 3. Analytics Microservice (Golang)
In a second terminal window:
```bash
cd microservice
go run main.go
```
*Go service connects directly to PostgreSQL with connection pooling and serves on **http://localhost:8080**.*

---

### 4. Frontend (React + Vite)
In a third terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Open **http://localhost:5173** in your browser.*

---

## 🔑 Pre-seeded Reviewer Credentials (1-Click Presets)
For immediate testing, click the **"Customer Demo"** or **"Admin Demo"** buttons in the UI header, or use the credentials below:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fonu.com` | `admin123` | Full inventory management (Create/Edit/Delete products), Global Order Ledger, Executive Analytics |
| **Customer** | `customer@fonu.com` | `customer123` | Browse catalog, live cart, transactional order placement, view personal order history |

---

## 📊 Database Schema & Raw Analytics Query

### PostgreSQL Schema
- **`users`**: `id` (UUID), `email` (VARCHAR, UNIQUE), `password` (VARCHAR, bcrypt), `role` (ENUM: `ADMIN`, `CUSTOMER`), `created_at` (TIMESTAMP)
- **`products`**: `id` (UUID), `name` (VARCHAR), `description` (TEXT), `price` (DECIMAL 10,2), `stock` (INT), `created_at` (TIMESTAMP)
- **`orders`**: `id` (UUID), `user_id` (UUID), `total_amount` (DECIMAL 10,2), `status` (VARCHAR), `created_at` (TIMESTAMP)
- **`order_items`**: `id` (UUID), `order_id` (UUID), `product_id` (UUID), `quantity` (INT), `price_at_purchase` (DECIMAL 10,2)

### Single Unified Raw CTE Query in Go (`GET /admin/analytics`)
```sql
WITH revenue_summary AS (
    SELECT 
        COALESCE(SUM(total_amount), 0.00) AS total_revenue,
        COUNT(DISTINCT id) AS total_orders
    FROM orders
    WHERE status = 'COMPLETED' OR status IS NULL
),
all_orders_count AS (
    SELECT COUNT(DISTINCT id) AS total_orders_all
    FROM orders
),
top_product AS (
    SELECT 
        oi.product_id,
        p.name AS product_name,
        COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    GROUP BY oi.product_id, p.name
    ORDER BY total_quantity_sold DESC
    LIMIT 1
)
SELECT 
    rs.total_revenue,
    aoc.total_orders_all AS total_orders,
    COALESCE(tp.product_name, 'N/A') AS top_selling_product_name,
    COALESCE(tp.product_id, 'N/A') AS top_selling_product_id
FROM revenue_summary rs
CROSS JOIN all_orders_count aoc
LEFT JOIN top_product tp ON TRUE;
```

---

## 🧪 Key REST API Endpoints

### Authentication
- `POST /auth/register` — Create account (`email`, `password`, optional `role`)
- `POST /auth/login` — Sign in and receive JWT bearer token
- `GET /auth/me` — Retrieve active profile from JWT

### Products (RBAC Enforced)
- `GET /products` — Public catalog listing
- `GET /products/:id` — Single product details
- `POST /products` — **ADMIN ONLY**: Create product (`name`, `price`, `stock`, `description`)
- `PUT /products/:id` — **ADMIN ONLY**: Update product details
- `DELETE /products/:id` — **ADMIN ONLY**: Delete product (safeguards existing order items)

### Orders
- `POST /orders` — **CUSTOMER ONLY**: Validates stock, executes atomic decrement inside Prisma transaction, returns order
- `GET /orders` — Role-scoped: Returns all orders for `ADMIN`, returns only personal orders for `CUSTOMER`
- `GET /orders/:id` — Order detail (forbidden if customer accesses another user's order)

### Analytics
- `GET /admin/analytics` (NestJS) — Queries Go microservice via `HttpService` with graceful database fallback
- `GET /admin/analytics` (Go Microservice, Port 8080) — Standalone raw SQL query execution

---

## 🔮 Future Improvements (Given More Time)
1. **Asynchronous Architecture:** Replace the direct database connection in the Go service with an event-driven system (e.g., RabbitMQ or Kafka). The NestJS backend would emit an `order.placed` event, and the Go service would consume it asynchronously to update a read-optimized analytics cache.
2. **Redis Caching:** Implement Redis cache layers on frequently read product catalogs to eliminate redundant DB hits, using cache invalidation tags whenever products are mutated.
3. **Robust Unit Test Coverage:** Expand end-to-end testing across both front-end (Cypress) and API flows, including database stress-testing for concurrency and idempotency under high-throughput order bursts.
