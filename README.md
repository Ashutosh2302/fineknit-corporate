# Fineknit Client & Admin Portal

Next.js full-stack app for managing client orders, SKUs, and inventory distribution for clothing orders.

## Stack

- Next.js (App Router) for frontend + backend routes
- MongoDB + Mongoose for persistence
- Cookie session auth with JWT

## Features implemented

### Client

- Login via email or phone + password
- Forgot password + reset password flow
- Inventory dashboard with totals:
  - total inventory
  - used/distributed inventory
  - available inventory
- Orders tab (shows only delivered order items)
- Per-SKU distribution form:
  - employee name
  - employee id
  - quantity
- View distributed history per SKU

### Admin

- Login via email or phone + password
- Create client account with admin-defined or auto-generated initial password
- Create SKU for selected client (name, description, image URL)
- Create order with multiple SKU line items
- Per line item: quantity, selling price, cost price, delivery date, invoice URL
- If order is marked delivered, inventory is created/updated automatically

## Data models

Implemented models (with auth fields added where needed):

- `Admin`
- `Client`
- `ClientSku`
- `ClientOrder` (line-item model with `orderCode` to group rows)
- `Inventory`
- `UsedInventory`

## Setup

1. Install deps:

```bash
npm install
```

2. Configure env:

```bash
cp .env.example .env.local
```

3. Run app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Create first admin

Use bootstrap route once:

```bash
curl -X POST http://localhost:3000/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fineknit.com",
    "phone": "+911234567890",
    "password": "Admin@123",
    "type": "super_admin"
  }'
```

If an admin already exists, pass `setupKey` that matches `ADMIN_SETUP_KEY`.

## Main API routes

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/bootstrap-admin`

Admin routes:
- `GET/POST /api/admin/clients`
- `GET/POST /api/admin/skus`
- `GET/POST /api/admin/orders`
- `PATCH /api/admin/orders/:id/deliver`

Client routes:
- `GET /api/client/inventory`
- `POST /api/client/inventory/:inventoryId/distribute`
- `GET /api/client/inventory/:inventoryId/distributed`
- `GET /api/client/orders`

## Notes

- Password reset returns a `resetTokenForDev` in API response for manual sharing/testing.
- New client passwords are marked expired by default, so first login requires reset.
# fineknit-corporate
