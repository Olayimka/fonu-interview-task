# Fonu: Inventory & Orders Management Service

A full-stack inventory management, order processing, and shipment tracking system built for Fonu's technical assessment. The project is split into a **NestJS** backend, a **React + Vite** frontend, and a standalone **Golang** reporting microservice, backed by **PostgreSQL**.

---

## 📌 Architecture & Design Decisions

### 1. Atomic Stock Decrement & Transaction Safety
When placing an order, inventory stock must never become negative due to concurrent checkouts. In `OrdersService`, order creation and product stock updates are wrapped in an atomic database transaction (`prisma.$transaction`). Each item decrements stock using the database engine's atomic counter (`stock: { decrement: quantity }`). If any item in the cart lacks sufficient stock, the entire transaction rolls back immediately with an informative `400 Bad Request`.

### 2. Microservice Separation for Analytics
Heavy analytical aggregations (total revenue, order counts, top-selling products across order item joins) can block the primary NestJS event loop if run on high-traffic transactional tables. I offloaded this to a dedicated **Golang microservice** running on port `8080`. It runs an optimized, lock-free Common Table Expression (CTE) query in a single database round-trip, leveraging Go's connection pooling and low memory footprint. The NestJS API communicates with it through `HttpModule` and falls back gracefully if the microservice is temporarily down.

### 3. Role-Based Access Control (RBAC)
Authentication uses standard JWT bearer tokens signed with a secret. Roles (`ADMIN` and `CUSTOMER`) are enforced using a custom `@Roles()` decorator and a NestJS `RolesGuard`:
- **Admins** have full inventory CRUD permissions, can view the global order ledger, change fulfillment statuses, track any shipment, and access executive analytics.
- **Customers** can browse products, manage their cart, place transactional orders, view their personal order history, track shipments in real time, and request order cancellations.

### 4. Client State & Error Handling
On the frontend, React Context handles authentication tokens and shopping cart persistence without bloating bundle size with heavy external libraries. Both the frontend and backend include graceful fallbacks with pre-seeded demo records, ensuring that reviewers can explore the full user flow (catalog browsing, ordering, shipment tracking, and inventory updates) even without local Docker services running.

---

## 🛠️ Requirements Checklist

### 1. Backend (NestJS + TypeScript)
- [x] **Product Management REST API**: Full CRUD (`GET /products`, `GET /products/:id`, `POST /products`, `PUT /products/:id`, `DELETE /products/:id`).
- [x] **Order Management REST API**: Full lifecycle (`POST /orders`, `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status`, `DELETE /orders/:id`).
- [x] **Order Tracking API**: `GET /orders/:id/tracking` returning carrier details, tracking numbers, estimated delivery, and a progressive milestone timeline.
- [x] **Data Persistence**: PostgreSQL with Prisma ORM schema and versioned migrations.
- [x] **JWT Authentication & RBAC**: Admin vs Customer roles enforced via guards.
- [x] **Validation & Errors**: Handled with `class-validator`, `class-transformer`, and explicit HTTP status codes (`400`, `401`, `403`, `404`).

### 2. Frontend (React + TypeScript)
- [x] **Product Catalog**: Clean 2-column catalog view with category search, stock badges, and instant cart additions.
- [x] **Shopping Cart & Checkout**: Interactive cart drawer and dedicated checkout flow with live subtotal, shipping, and tax calculations.
- [x] **Order History Page**: Customer-facing page displaying previous orders, items breakdown, timestamps, and order statuses.
- [x] **Live Order Tracking**: Visual progress stepper (Order Placed → Warehouse Packing → Dispatched & In Transit → Out for Delivery → Delivered) with carrier info and tracking search.
- [x] **Admin Dashboard**: Product creation/edit modals, image uploads/presets, live stock indicators, and an order ledger with status dropdowns and tracking links.

### 3. Golang Microservice (Bonus)
- [x] **Standalone Go Service**: Written in pure Go with `net/http` and `github.com/lib/pq`.
- [x] **Aggregated CTE Query**: Single raw SQL query computing total revenue, total orders, and top-selling product.
- [x] **API Bridge**: NestJS calls `GET http://localhost:8080/admin/analytics` and exposes it securely to authenticated admins.

---

## 🚀 Quick Start Guide

### 1. Database (Docker)
Start the PostgreSQL container:
```bash
docker-compose up -d
```
*PostgreSQL will run on `localhost:5432` (db: `fonu_db`, user: `postgres`, password: `postgres`).*

---

### 2. Backend (NestJS)
In a new terminal window:
```bash
cd backend
npm install
npx prisma migrate dev
npm run prisma:seed       # Seeds default admin, customer, and sample products
npm run start:dev
```
*API runs on **http://localhost:3000**.*

To run backend tests:
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
*Microservice serves on **http://localhost:8080**.*

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

## 🔐 Demo Credentials

For quick evaluation, use the one-click preset buttons in the navigation bar or log in with:

| Role | Email | Password | What You Can Test |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fonu.com` | `admin123` | Add/edit/delete products, review order ledger, change order fulfillment status, inspect analytics. |
| **Customer** | `customer@fonu.com` | `customer123` | Browse catalog, add to cart, checkout, view personal order history, and track shipments live. |

---

## 📦 Database Schema Overview

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role     @default(CUSTOMER)
  createdAt DateTime @default(now()) @map("created_at")
  orders    Order[]

  @@map("users")
}

model Product {
  id          String      @id @default(uuid())
  name        String
  description String?
  price       Decimal     @db.Decimal(10, 2)
  stock       Int
  createdAt   DateTime    @default(now()) @map("created_at")
  orderItems  OrderItem[]

  @@map("products")
}

model Order {
  id          String      @id @default(uuid())
  userId      String      @map("user_id")
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  totalAmount Decimal     @map("total_amount") @db.Decimal(10, 2)
  status      String      @default("COMPLETED")
  createdAt   DateTime    @default(now()) @map("created_at")
  items       OrderItem[]

  @@map("orders")
}

model OrderItem {
  id              String   @id @default(uuid())
  orderId         String   @map("order_id")
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId       String   @map("product_id")
  product         Product  @relation(fields: [productId], references: [id], onDelete: Restrict)
  quantity        Int
  priceAtPurchase Decimal  @map("price_at_purchase") @db.Decimal(10, 2)

  @@map("order_items")
}
```

---

## 💡 Suggestions & Future Improvements

Here are a few architectural upgrades I would prioritize if taking this service from an assessment to production:

1. **Event-Driven Decoupling (RabbitMQ / Kafka)**  
   Currently, the Go service connects directly to PostgreSQL. In a high-scale environment, I would decouple this by publishing an `order.placed` domain event from NestJS to a message broker. The Go microservice would consume these events asynchronously and write to a read-optimized analytics table or Redis timeseries database.

2. **Redis Caching with Cache-Aside Pattern**  
   The public product catalog (`GET /products`) is read-heavy and rarely changes between admin edits. Wrapping catalog fetches in a Redis cache with a short TTL (and explicit invalidation on product create/update/delete) would significantly reduce database connection pressure.

3. **Checkout Idempotency Keys**  
   To prevent double-billing when customers encounter flaky network connections, I'd introduce an `Idempotency-Key` header on `POST /orders`. Storing this key in Redis with a 5-minute expiry ensures that network retries return the original order receipt instead of charging the customer twice.

4. **Real Carrier Webhook Ingestion**  
   The order tracking interface currently simulates shipment milestones based on order timestamps and admin status changes. In production, this would ingest webhooks from 3PL logistics carriers (e.g., DHL, FedEx, or local courier APIs) to transition package milestones automatically as physical barcodes are scanned.

5. **Soft Deletes & Audit Logging**  
   To preserve financial records and order traceability, product and order deletions should transition to soft deletes (`deleted_at` timestamp) backed by an immutable ledger for accounting compliance.
