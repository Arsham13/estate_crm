# 🏠 Real Estate CRM — Smart Property Management

A professional CRM for real estate agents, built with **React + Vite + Pure JavaScript** (no TypeScript, no Next.js).

## ✨ Features

- **Multi-role Authentication** — Admin, Advisor, Assistant with page-level access control
- **Dashboard** with stat cards, revenue charts, customer sources, sales funnel, and recent activities
- **Customer Management** — Full CRUD, filtering, search, CSV export, sortable table
- **Property Management** — Full CRUD, list/grid view, advanced filters
- **Contracts, Tasks, Visits** — Sortable tables with full CRUD
- **Sales Pipeline** — Kanban board with Drag & Drop (@hello-pangea/dnd)
- **Calendar** — Monthly/weekly/daily event views (react-big-calendar)
- **Financial Report** — Revenue chart, advisor comparison, commission table
- **Settings** — User management and activity logs
- **Full Dark Mode** across all pages
- **RTL** layout with **Vazirmatn** Persian font
- **Fully Responsive** — sidebar converts to bottom navigation on mobile
- **Subtle Animations** — scroll-triggered element entry animations, active click effects

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts |
| Routing | React Router DOM v6 |
| HTTP | Axios |
| Icons | Lucide React |
| Forms | Controlled components + custom validators |
| Backend | JSON Server (mock API) |
| Calendar | react-big-calendar |
| Drag & Drop | @hello-pangea/dnd |
| Date | moment-jalaali (Jalali/Persian calendar) |
| Notifications | react-hot-toast |
| Font | Vazirmatn (CDN) |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Extract the ZIP file
cd real-estate-crm

# Install packages
npm install
```

### Run

To run both the frontend and mock API backend simultaneously:

```bash
npm start
```

This command runs two services at once:
- **JSON Server** on port `3001` (mock API)
- **Vite dev server** on port `5173` (frontend)

Then open `http://localhost:5173` in your browser.

### Running Separately

```bash
# Terminal 1 — Run mock API
npm run server

# Terminal 2 — Run frontend
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## 👤 Demo Accounts

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | `admin@crm.com` | `admin123` | All pages + Settings |
| Advisor | `advisor@crm.com` | `advisor123` | All pages except Settings (only own data) |
| Assistant | `assistant@crm.com` | `assistant123` | Read-only (no add/edit/delete) |

Shortcut buttons are available on the login page to auto-fill each account.

## 📁 Folder Structure

```
real-estate-crm/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── common/        # Base components (Button, Input, Table, Modal, ...)
│   │   ├── layout/        # Sidebar, Header, MainLayout
│   │   ├── dashboard/     # StatCard, Charts, ...
│   │   ├── customers/     # CustomerForm, CustomerProfile
│   │   ├── properties/    # PropertyForm, PropertyCard
│   │   ├── contracts/     # ContractForm
│   │   ├── tasks/         # TaskForm
│   │   ├── visits/        # VisitForm
│   │   ├── pipeline/      # KanbanCard, KanbanColumn
│   │   ├── reports/       # RevenueReport, AdvisorComparison, ReportTable
│   │   └── settings/      # UserForm, ChangePasswordModal
│   ├── context/           # AuthContext, ThemeContext, NotificationContext
│   ├── hooks/             # useScrollAnimations, useApi
│   ├── pages/             # Login, Dashboard, Customers, Properties, ...
│   ├── routes/            # AppRouter, PrivateRoute, RoleRoute
│   ├── services/          # api, authService, customerService, ...
│   └── utils/             # constants, formatters, helpers, validators, exportCSV
├── db.json                # JSON Server database (seed data)
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## 🎨 Design System

- **Primary Color**: Gold `#D4A017`
- **Font**: Vazirmatn (Persian, RTL)
- **Border Radius**: `rounded-xl`
- **Subtle Shadow**: `shadow-sm`
- **Dark Mode**: Via `data-theme="dark"` on `<html>` and CSS Variables

## ✅ UI Features

- **Collapsible Sidebar**: Click the chevron button to collapse the sidebar to icon-only mode (state persisted in localStorage)
- **Sortable Tables**: Click any column header to sort data (toggles ascending/descending)
- **Scroll Animations**: Elements gracefully appear when entering the viewport (using `IntersectionObserver`)
- **Active Effect**: All buttons apply a `scale(0.96)` effect on click
- **cursor-pointer**: Applied to all clickable elements
- **Dark Mode Toggle**: Located in the header
- **Global Search**: In the header, searches across customers/properties/contracts simultaneously
- **Notifications**: Bell icon with unread count, dropdown with notification list
- **Toast Notifications**: For all CRUD operations

## 📝 Notes

- Data is stored in `db.json` and resets when JSON Server restarts
- Dates are displayed in Jalali (Persian) calendar format (moment-jalaali)
- Numbers are formatted with Persian numerals and thousand separators
- CSV export supports UTF-8 (with BOM for Excel compatibility)

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).