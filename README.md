# TFI Club — Full-Stack E-Commerce Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
</p>

A modern, full-stack e-commerce web application for **TFI Club** — featuring a customer-facing storefront, a powerful admin dashboard, and a robust NestJS REST API backend.

---

## 📁 Project Structure

```
TFI/
├── frontend/       # Customer-facing storefront (React + Vite)
├── admin/          # Admin dashboard (React + Vite)
└── backend/        # REST API server (NestJS + Prisma + Supabase)
```

---

## ✨ Features

### 🛍️ Customer Storefront (`/frontend`)
- **Home page** with brand intro animation, particle effects, and social proof toasts
- **Shop** — browse and filter products by category
- **Product Detail** — rich product pages with image gallery and reviews
- **Cart & Wishlist** — full cart management with quantity controls
- **Checkout** — Razorpay (India) & Stripe (International) payment integration
- **Order Tracking** — view order status and payment history in profile
- **Authentication** — JWT-based login, registration, forgot/reset password
- **Cinema page** — brand media experience
- **Responsive design** — mobile bottom nav, smooth page transitions with Framer Motion
- **Support pages** — FAQ, Privacy Policy, Returns, Terms & Conditions

### 🔧 Admin Dashboard (`/admin`)
- **Dashboard** — sales analytics and KPI cards
- **Products** — full CRUD with image upload (Supabase Storage)
- **Orders** — view and manage all customer orders
- **Payments** — Razorpay & Stripe payment tracking
- **Customers** — user management
- **Categories** — product category management
- **Reviews** — moderate product reviews
- **Newsletter** — subscriber management
- **Contacts** — customer enquiry inbox
- **Settings** — store configuration

### ⚙️ Backend API (`/backend`)
- **NestJS** modular architecture with TypeScript
- **Prisma ORM** with PostgreSQL (Supabase)
- **Supabase Auth** integration with JWT verification
- **Payments** — Razorpay + Stripe with webhook handling
- **File Upload** — Supabase Storage via signed URLs
- **Email** — Nodemailer for transactional emails
- **SMS** — Twilio integration
- **Rate Limiting** — `@nestjs/throttler`
- **Security** — Helmet, bcrypt password hashing
- **Swagger API Docs** — auto-generated at `/api`
- **Health checks** — `/health` endpoint

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 19 + TypeScript |
| Admin Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Routing | React Router DOM v7 |
| Animations | Framer Motion |
| Icons | Lucide React |
| HTTP Client | Axios |
| Toast Notifications | React Hot Toast |
| Backend Framework | NestJS 11 |
| ORM | Prisma 7 |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth + JWT (Passport) |
| Payments | Razorpay + Stripe |
| File Storage | Supabase Storage |
| Email | Nodemailer |
| SMS | Twilio |
| API Docs | Swagger / OpenAPI |
| Deployment (Frontend) | Vercel |
| Deployment (Backend) | Cloud Run / Node.js |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- A **Supabase** project (PostgreSQL database + Auth + Storage)
- **Razorpay** account (for Indian payments)
- **Stripe** account (for international payments)

---

### 1. Clone the repository

```bash
git clone https://github.com/maniprasad76/TFICLUB.git
cd TFICLUB
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

#### Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database (Supabase PostgreSQL — Session Mode Pooler)
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres"

# Supabase
SUPABASE_URL="https://<ref>.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_JWT_SECRET="your-supabase-jwt-secret"

# Razorpay
RAZORPAY_KEY_ID="rzp_test_xxx"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
RAZORPAY_WEBHOOK_SECRET=""

# Stripe (International Payments)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Admin Credentials (used by seeder)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-me"

# Server
PORT=3001
FRONTEND_URL="http://localhost:5173"
ADMIN_URL="http://localhost:5174"
```

#### Run database migrations

```bash
npx prisma migrate deploy
```

#### Start the backend server

```bash
# Development (watch mode)
npm run dev

# Production
npm run start:prod
```

The API will be available at `http://localhost:3001`  
Swagger docs: `http://localhost:3001/api`

---

### 3. Frontend (Storefront) Setup

```bash
cd frontend
npm install
```

Create `.env` in `frontend/`:

```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

```bash
npm run dev
```

The storefront will be available at `http://localhost:5173`

---

### 4. Admin Dashboard Setup

```bash
cd admin
npm install
```

Create `.env` in `admin/`:

```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

```bash
npm run dev
```

The admin panel will be available at `http://localhost:5174`

---

## 📦 API Endpoints Overview

| Module | Prefix | Description |
|--------|--------|-------------|
| Auth | `/auth` | Login, register, password reset |
| Users | `/users` | User profile management |
| Products | `/products` | Product CRUD |
| Categories | `/categories` | Category management |
| Cart | `/cart` | Shopping cart |
| Wishlist | `/wishlist` | Wishlist management |
| Orders | `/orders` | Order management |
| Payments | `/payments` | Razorpay & Stripe |
| Reviews | `/reviews` | Product reviews |
| Upload | `/upload` | File upload (Supabase Storage) |
| Newsletter | `/newsletter` | Email subscriptions |
| Contact | `/contact` | Contact form submissions |
| Dashboard | `/dashboard` | Admin analytics |
| Settings | `/settings` | Store settings |
| Health | `/health` | Health check |

> Full API documentation available at `/api` (Swagger UI) when the backend is running.

---

## 🚢 Deployment

### Frontend & Admin — Vercel

Both `frontend` and `admin` include a `vercel.json` for seamless Vercel deployments. Connect your GitHub repo to Vercel and set the environment variables in the Vercel dashboard.

### Backend — Cloud Run / VPS

```bash
cd backend
npm run build
npm run start:prod
```

Or deploy as a Docker container / Cloud Run service. Set all environment variables in your hosting provider's dashboard.

---

## 🔐 Security Notes

- Never commit `.env` files — they are gitignored
- Use the `.env.example` file as a reference template
- Rotate all secrets before going to production
- The admin dashboard should be deployed on a separate, restricted domain

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

<p align="center">Built with ❤️ by the TFI Club team</p>
