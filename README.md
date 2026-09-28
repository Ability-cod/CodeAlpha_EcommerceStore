# CodeAlpha E-commerce Store

A full-stack e-commerce web application built for the **CodeAlpha Full Stack Development Internship (Task 1: Simple E-commerce Store)**.

Customers can browse products, fill a cart and place orders. Admins manage the catalogue (including image uploads) and the order lifecycle from a dashboard.

## Features

**Customers**
- Register and log in (JWT authentication, hashed passwords)
- Browse products with search, category filters and sorting
- Product details page with live stock information
- Shopping cart with quantity controls (saved in the browser)
- Checkout that creates an order and reduces stock
- Order history with item details and status

**Admin**
- Dashboard with key numbers: products, orders, revenue and low-stock items
- Add, edit and delete products with **image upload** and live preview
- View all orders and update their status

**Quality and security**
- Passwords hashed with bcrypt, JWT-protected routes, role-based access (customer / admin)
- Checkout runs inside a database transaction with row locking to prevent overselling
- Upload validation: image types only, 5MB limit, randomized file names
- Responsive, modern UI with loading skeletons and toast notifications

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, plain CSS |
| Backend | Node.js, Express.js |
| Database | MySQL (mysql2) |
| Auth | JSON Web Tokens, bcryptjs |
| Uploads | Multer |

## Project structure

```
CodeAlpha_EcommerceStore/
├── backend/          Express API (routes, controllers, models, middleware)
├── frontend/         React app (pages, components, context)
└── database/
    └── schema.sql    MySQL schema
```

## Getting started

**Requirements:** Node.js 18+ and MySQL (XAMPP works well).

1. **Clone the repository**
```bash
   git clone https://github.com/YOUR_USERNAME/CodeAlpha_EcommerceStore.git
   cd CodeAlpha_EcommerceStore
```

2. **Create the database**
   Import `database/schema.sql` using phpMyAdmin (Import tab) or the MySQL CLI:
```bash
   mysql -u root -p < database/schema.sql
```

3. **Start the backend**
```bash
   cd backend
   npm install
   cp .env.example .env
```
   Open `.env`, set your database credentials and replace `JWT_SECRET` with a long random string. You can generate one with:
```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
   Then run:
```bash
   npm run dev
```
   The API runs on http://localhost:5000.

4. **Start the frontend** (in a second terminal)
```bash
   cd frontend
   npm install
   npm run dev
```
   The app runs on http://localhost:5173. The API address is configured in `frontend/src/api.js`.

5. **Create an admin account**
   Register a normal account in the app, then promote it in MySQL:
```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```
   Log out and log in again. A **Dashboard** link will appear in the navigation bar.

## API overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create an account |
| POST | `/api/auth/login` | Public | Log in and receive a token |
| GET | `/api/products` | Public | List products |
| GET | `/api/products/:id` | Public | Product details |
| POST | `/api/products` | Admin | Add a product (multipart form with image) |
| PUT | `/api/products/:id` | Admin | Update a product |
| DELETE | `/api/products/:id` | Admin | Delete a product |
| POST | `/api/orders/checkout` | Customer | Place an order from the cart |
| GET | `/api/orders/my-orders` | Customer | List my orders |
| GET | `/api/orders/:id/items` | Owner / Admin | Items in an order |
| GET | `/api/orders/all` | Admin | List all orders |
| PUT | `/api/orders/:id/status` | Admin | Update order status |

## Planned improvements

- Shipping address and payment method at checkout (cash on delivery first, then card payments through a payment gateway)

## Author

**Ability Mbeki Johnbosco**, CodeAlpha Full Stack Development Intern (October 2026)