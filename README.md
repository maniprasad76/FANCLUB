<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=FAN%20Club&fontSize=60&fontAlignY=35&animation=twinkling&fontColor=ffffff" alt="FAN Club Banner" />

  <h3 align="center">Next-Generation Full-Stack E-Commerce Platform</h3>
  
  <p align="center">
    A premium shopping experience powered by a robust, scalable backend.
    <br />
    <a href="#-features"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="#-customer-storefront-frontend">Storefront</a>
    ·
    <a href="#-admin-dashboard-admin">Admin Panel</a>
    ·
    <a href="#-backend-api-backend">REST API</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/NestJS_11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
    <img src="https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Prisma_7-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Vite_8-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  </p>
</div>

---

## 📖 Table of Contents
- [About The Project](#-about-the-project)
- [Project Architecture](#-project-architecture)
- [Stunning Features](#-stunning-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 About The Project

**FAN Club** is not just an e-commerce platform; it's a meticulously crafted digital ecosystem. Designed with modern aesthetics and performance in mind, it provides a seamless shopping journey for customers and a powerful command center for administrators, all backed by a high-performance RESTful API.

---

## 🏗️ Project Architecture

A clean, monorepo-style structure separates concerns for maximum scalability.

```text
FAN/
├── 🛍️ frontend/       # Customer-facing storefront (React + Vite)
├── 📊 admin/          # Admin dashboard (React + Vite)
└── ⚙️ backend/        # REST API server (NestJS + Prisma + Supabase)
```

---

## ✨ Stunning Features

### 🛍️ Customer Storefront (`/frontend`)
> A captivating, responsive experience built for conversion.

* **Immersive Landing Page:** Brand intro animations, particle effects, and dynamic social proof toasts.
* **Seamless Discovery:** Rich product pages, intuitive category filters, and high-quality image galleries.
* **Frictionless Checkout:** Integrated Razorpay with cart & wishlist management.
* **Customer Hub:** Secure JWT authentication, order tracking, and profile management.
* **Fluid UX:** Smooth page transitions powered by Framer Motion and a responsive mobile-first design.

### 📊 Admin Dashboard (`/admin`)
> Total control over your business operations.

* **Command Center:** Real-time sales analytics and KPI tracking.
* **Catalog Management:** Full product CRUD with seamless Supabase Storage image uploads.
* **Order & Payment Tracking:** Comprehensive oversight of customer orders and Razorpay transactions.
* **CRM Tools:** Customer management, newsletter subscriptions, and contact inquiries.
* **Moderation:** Review moderation and dynamic store configuration settings.

### ⚙️ Backend API (`/backend`)
> A robust, secure, and blazing-fast foundation.

* **Enterprise Architecture:** Modular NestJS design with strict TypeScript typing.
* **Data Layer:** Prisma ORM connected to Supabase PostgreSQL.
* **Fortified Security:** Supabase Auth, bcrypt, Helmet, and `@nestjs/throttler` rate limiting.
* **Integrated Services:** Supabase Storage (Files).
* **Developer Ready:** Auto-generated Swagger API documentation and comprehensive health checks.

---

## 💻 Tech Stack

<details>
<summary>Click to expand full technology stack</summary>

| Category | Technology |
|:---|:---|
| **Frontend UI** | React 19, TypeScript, React Router DOM v7 |
| **Admin UI** | React 19, TypeScript, React Router DOM v7 |
| **Styling & Motion** | Framer Motion, Lucide React, CSS/Tailwind |
| **State & Fetching** | Axios, React Hot Toast |
| **Build Tool** | Vite 8 |
| **Backend Core** | NestJS 11, TypeScript |
| **Database & ORM** | PostgreSQL (Supabase), Prisma 7 |
| **Auth & Storage** | Supabase Auth, Passport, Supabase Storage |
| **Payments** | Razorpay |
| **Documentation** | Swagger / OpenAPI |
| **Deployment** | Vercel (Frontend/Admin), Cloud Run / Node.js (Backend) |

</details>

---

## 🛠️ Getting Started

Follow these steps to set up the project locally.

### Prerequisites

Ensure you have the following installed and configured:
- **Node.js** v18+ & **npm** v9+
- A **Supabase** Project (PostgreSQL + Auth + Storage)
- **Razorpay** Account

### 1. Clone the repository

```bash
git clone https://github.com/maniprasad76/FANCLUB.git
cd FANCLUB
```

### 2. Backend Setup

<details>
<summary>Expand for backend configuration steps</summary>

```bash
cd backend
npm install
```

**Configure Environment:**
```bash
cp .env.example .env
```
*Populate `.env` with your Supabase and Razorpay credentials.*

**Database Migration & Run:**
```bash
npx prisma migrate deploy
npm run dev
```
*API running at `http://localhost:3001` | Swagger docs at `http://localhost:3001/api`*

</details>

### 3. Frontend & Admin Setup

<details>
<summary>Expand for frontend/admin configuration steps</summary>

**Storefront:**
```bash
cd frontend
npm install
# Create .env with VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```
*Storefront running at `http://localhost:5173`*

**Admin Dashboard:**
```bash
cd admin
npm install
# Create .env with VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```
*Admin panel running at `http://localhost:5174`*

</details>

---

## 📦 API Reference

The backend provides a comprehensive REST API. Once running, visit `http://localhost:3001/api` for the interactive Swagger documentation.

**Core Endpoints:**
* `🔑 /auth` - Authentication & Password Management
* `👤 /users` - Profile Management
* `🛍️ /products` - Product Catalog CRUD
* `🛒 /cart` & `❤️ /wishlist` - Shopping Utilities
* `💳 /payments` - Razorpay Webhooks
* `📊 /dashboard` - Analytics Data

---

## ☁️ Deployment

* **Frontend & Admin:** Optimized for **Vercel**. Connect your repository and add environment variables.
* **Backend:** Deployable as a Docker container on **Google Cloud Run** or any VPS via Node.js.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🛡️ License & Security

* **Security:** Never commit `.env` files. Rotate secrets before production.
* **License:** This project is private and proprietary. All rights reserved.

---

<div align="center">
  <p>Built with ❤️ by the FAN Club team</p>
  <img src="https://capsule-render.vercel.app/api?type=transparent&color=gradient&height=50&section=footer&text=&fontSize=60" />
</div>
