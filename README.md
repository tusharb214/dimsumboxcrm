# FranchiseCRM — Frontend

A premium, enterprise-grade Franchise Management CRM frontend built with React, TypeScript, and Tailwind CSS.

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16
- npm >= 8

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and update the API URL:

```bash
cp .env.example .env
```

```env
REACT_APP_API_URL=http://localhost:8080/api
```

### Run Development Server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
```

---

## 👤 Roles & Routes

| Role        | Login Route | Dashboard Route   |
|-------------|-------------|-------------------|
| USER        | /login      | /dashboard        |
| ADMIN       | /login      | /admin            |
| KITCHEN     | /login      | /kitchen          |
| SUPER_ADMIN | /login      | /superadmin       |

---

## 📁 Project Structure

```
src/
├── api/
│   ├── client.ts          # Axios instance with interceptors
│   └── services.ts        # All API service functions
├── components/
│   ├── common/            # Reusable UI components
│   │   ├── EmptyState.tsx
│   │   ├── Modal.tsx
│   │   ├── Pagination.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Skeleton.tsx
│   │   ├── StatCard.tsx
│   │   └── StatusBadge.tsx
│   └── layout/
│       ├── Navbar.tsx
│       └── Sidebar.tsx
├── context/
│   └── AuthContext.tsx    # Auth state + JWT handling
├── layouts/
│   └── DashboardLayout.tsx
├── pages/
│   ├── auth/              # Login, Register, ForgotPassword, ResetPassword
│   ├── user/              # User dashboard, orders, analytics, notifications
│   ├── admin/             # Admin dashboard + all management pages
│   ├── kitchen/           # Kitchen dashboard, dispatch, approvals
│   └── superadmin/        # Super admin overview pages
├── routes/
│   └── ProtectedRoute.tsx # Role-based route guards
├── types/
│   └── index.ts           # TypeScript interfaces
└── index.css              # Tailwind + custom utility classes
```

---

## 🔌 API Integration

### Available Endpoints

| Method | Endpoint                          | Used In              |
|--------|-----------------------------------|----------------------|
| POST   | /api/auth/login                   | Login page           |
| POST   | /api/auth/register                | Register page        |
| GET    | /api/orders                       | My Orders page       |
| POST   | /api/orders                       | Place Order page     |
| GET    | /api/admin/orders                 | Admin Orders         |
| PUT    | /api/admin/orders/:id/assign      | Admin Orders         |
| PUT    | /api/admin/orders/:id/status      | Admin Orders         |
| POST   | /api/admin/users                  | Admin Users          |
| GET    | /api/admin/users                  | Admin Users          |
| POST   | /api/admin/kitchens               | Admin Kitchens       |
| GET    | /api/admin/kitchens               | Admin Kitchens       |
| GET    | /api/kitchen/orders               | Kitchen Dashboard    |
| PUT    | /api/kitchen/orders/:id/status    | Kitchen Dashboard    |

### Pages with Backend Integration Pending

- Revenue analytics (User + Admin)
- Product management (Admin)
- Category management (Admin)
- Notifications (User + Admin)
- Stock alerts (User)
- Dispatch form (Kitchen)
- Approval workflow (Kitchen)
- All Super Admin pages

These pages have full UI built with static/dummy data. Connect real APIs when available.

---

## 🎨 Tech Stack

- **React 18** + **TypeScript**
- **Tailwind CSS 3** — utility-first styling
- **React Router v6** — client-side routing
- **Axios** — HTTP client with interceptors
- **Recharts** — charts and analytics
- **React Hot Toast** — toast notifications
- **Lucide React** — icons

---

## 🔐 Auth Flow

1. User logs in → receives JWT token
2. Token stored in `localStorage`
3. Axios interceptor attaches token to every request
4. On 401 response → auto logout + redirect to `/login`
5. Role read from decoded user object → redirects to correct dashboard
