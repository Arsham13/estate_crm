# 🏠 املاک CRM — مدیریت هوشمند املاک

یک CRM حرفه‌ای برای مشاوران املاک، ساخته‌شده با **React + Vite + JavaScript خالص** (بدون TypeScript، بدون Next.js).

## ✨ ویژگی‌ها

- **احراز هویت چندنقشی** — مدیر (admin)، مشاور (advisor)، دستیار (assistant) با کنترل دسترسی صفحه‌به‌صفحه
- **داشبورد** با کارت‌های آماری، نمودارهای درآمد، منابع مشتریان، قیف فروش و فعالیت‌های اخیر
- **مدیریت مشتریان** — CRUD کامل، فیلتر، جستجو، Export CSV، جدول قابل مرتب‌سازی
- **مدیریت ملک‌ها** — CRUD کامل، نمایش لیست/گرید، فیلترهای پیشرفته
- **قراردادها، وظایف، بازدیدها** — جداول sortable با CRUD کامل
- **پایپ‌لاین فروش** — کانبان با Drag & Drop (@hello-pangea/dnd)
- **تقویم** — نمایش ماهانه/هفتگی/روزانه رویدادها (react-big-calendar)
- **گزارش مالی** — نمودار درآمد، مقایسه مشاوران، جدول کمیسیون
- **تنظیمات** — مدیریت کاربران و لاگ فعالیت‌ها
- **Dark Mode** کامل در همه صفحات
- **RTL** و فونت فارسی **Vazirmatn**
- **Fully Responsive** — سایدبار در موبایل به bottom navigation تبدیل می‌شود
- **انیمیشن‌های ظریف** — انیمیشن ورود المنت‌ها هنگام اسکرول، افکت active روی کلیک‌ها

## 🛠️ تکنولوژی‌ها

| دسته | تکنولوژی |
|------|----------|
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
| Date | moment-jalaali (تاریخ شمسی) |
| Notifications | react-hot-toast |
| Font | Vazirmatn (CDN) |

## 🚀 راه‌اندازی

### پیش‌نیازها
- Node.js 18+
- npm یا yarn

### نصب

```bash
# استخراج فایل ZIP
cd real-estate-crm

# نصب پکیج‌ها
npm install
```

### اجرا

برای اجرای همزمان frontend و mock API backend:

```bash
npm start
```

این دستور همزمان دو سرویس را اجرا می‌کند:
- **JSON Server** روی پورت `3001` (mock API)
- **Vite dev server** روی پورت `5173` (frontend)

سپس آدرس `http://localhost:5173` را در مرورگر باز کنید.

### اجرای جداگانه

```bash
# ترمینال ۱ — اجرای mock API
npm run server

# ترمینال ۲ — اجرای frontend
npm run dev
```

### Build نهایی

```bash
npm run build
npm run preview
```

## 👤 حساب‌های نمایشی

| نقش | ایمیل | رمز عبور | دسترسی |
|------|-------|----------|--------|
| مدیر | `admin@crm.com` | `admin123` | همه صفحات + تنظیمات |
| مشاور | `advisor@crm.com` | `advisor123` | همه صفحات به‌جز تنظیمات (فقط داده‌های خودش) |
| دستیار | `assistant@crm.com` | `assistant123` | فقط خواندن (بدون افزودن/ویرایش/حذف) |

روی صفحه لاگین، دکمه‌های میانبر برای پر کردن خودکار هر حساب وجود دارد.

## 📁 ساختار پوشه‌ها

```
real-estate-crm/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── common/        # کامپوننت‌های پایه (Button, Input, Table, Modal, ...)
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
├── db.json                # دیتابیس JSON Server (seed data)
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## 🎨 سیستم طراحی

- **رنگ اصلی**: طلایی `#D4A017`
- **فونت**: Vazirmatn (فارسی، RTL)
- **گوشه‌های گرد**: `rounded-xl`
- **سایه ظریف**: `shadow-sm`
- **Dark Mode**: از طریق `data-theme="dark"` روی `<html>` و CSS Variables

## ✅ ویژگی‌های UI

- **سایدبار Collapsible**: با کلیک روی دکمه-chevron، سایدبار جمع می‌شود و فقط آیکون‌ها نمایش داده می‌شوند (state در localStorage ذخیره می‌شود)
- **جداول Sortable**: با کلیک روی هدر هر ستون، داده‌ها بر اساس آن ستون مرتب می‌شوند (تبدیل بین صعودی/نزولی)
- **انیمیشن اسکرول**: المنت‌ها با ورود به viewport به‌آرامی ظاهر می‌شوند (با `IntersectionObserver`)
- **افکت Active**: روی کلیک همه دکمه‌ها، افکت `scale(0.96)` اعمال می‌شود
- **cursor-pointer**: روی همه عناصر قابل کلیک
- **Dark Mode toggle**: در هدر
- **جستجوی سراسری**: در هدر، همزمان در مشتریان/ملک‌ها/قراردادها
- **اعلان‌ها**: زنگ با تعداد خوانده‌نشده، dropdown با لیست اعلان‌ها
- **Toast Notifications**: برای همه عملیات‌های CRUD

## 📝 نکات

- داده‌ها در `db.json` ذخیره می‌شوند و با ری‌استارت JSON Server ریست می‌شوند
- تاریخ‌ها به شمسی نمایش داده می‌شوند (moment-jalaali)
- اعداد با فرمت فارسی و جداکننده هزارگان نمایش داده می‌شوند
- Export CSV با پشتیبانی از UTF-8 (با BOM برای اکسل)

## 📄 لایسنس

این پروژه برای اهداف آموزشی و رزومه ساخته شده است. استفاده آزاد.
