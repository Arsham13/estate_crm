// ثابت‌های پروژه

// نقش‌های کاربری
export const ROLES = {
  ADMIN: 'admin',
  ADVISOR: 'advisor',
  ASSISTANT: 'assistant',
}

export const ROLE_LABELS = {
  admin: 'مدیر',
  advisor: 'مشاور',
  assistant: 'دستیار',
}

// آیتم‌های منوی سایدبار
export const NAV_ITEMS = [
  { key: 'dashboard',  label: 'داشبورد',       icon: 'LayoutDashboard', path: '/dashboard' },
  { key: 'customers',  label: 'مشتریان',       icon: 'Users',           path: '/customers' },
  { key: 'properties', label: 'ملک‌ها',         icon: 'Building2',       path: '/properties' },
  { key: 'contracts',  label: 'قراردادها',     icon: 'FileText',        path: '/contracts' },
  { key: 'tasks',      label: 'وظایف',         icon: 'CheckSquare',     path: '/tasks' },
  { key: 'visits',     label: 'بازدیدها',      icon: 'CalendarCheck',   path: '/visits' },
  { key: 'pipeline',   label: 'پایپ‌لاین فروش', icon: 'TrendingUp',      path: '/pipeline' },
  { key: 'calendar',   label: 'تقویم',         icon: 'Calendar',        path: '/calendar' },
  { key: 'reports',    label: 'گزارش مالی',    icon: 'BarChart3',       path: '/reports' },
  { key: 'settings',   label: 'تنظیمات',       icon: 'Settings',        path: '/settings' },
]

// انواع مشتری
export const CUSTOMER_TYPES = [
  { value: 'buyer',    label: 'خریدار' },
  { value: 'seller',   label: 'فروشنده' },
  { value: 'tenant',   label: 'مستأجر' },
  { value: 'landlord', label: 'موجر' },
]

// منابع آشنایی مشتری
export const CUSTOMER_SOURCES = [
  { value: 'instagram', label: 'اینستاگرام' },
  { value: 'referral',  label: 'معرفی' },
  { value: 'divar',     label: 'دیوار' },
  { value: 'website',   label: 'سایت' },
  { value: 'other',     label: 'سایر' },
]

// مراحل پایپ‌لاین
export const PIPELINE_STAGES = [
  { value: 'new',           label: 'جدید',                  color: 'info',    icon: 'Sparkles' },
  { value: 'following',     label: 'در حال پیگیری',         color: 'warning', icon: 'Phone' },
  { value: 'visit',         label: 'بازدید برنامه‌ریزی شده', color: 'gold',    icon: 'Home' },
  { value: 'negotiation',   label: 'در حال مذاکره',         color: 'purple',  icon: 'MessageSquare' },
  { value: 'closed',        label: 'قرارداد بسته شده',      color: 'success', icon: 'CheckCircle2' },
  { value: 'lost',          label: 'از دست رفته',           color: 'error',   icon: 'XCircle' },
]

// انواع ملک
export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'آپارتمان' },
  { value: 'villa',     label: 'ویلا' },
  { value: 'shop',      label: 'مغازه' },
  { value: 'land',      label: 'زمین' },
]

// انواع معامله
export const DEAL_TYPES = [
  { value: 'sale',  label: 'فروش' },
  { value: 'rent',  label: 'اجاره' },
  { value: 'mortgage', label: 'رهن' },
]

// وضعیت ملک
export const PROPERTY_STATUS = [
  { value: 'available',  label: 'موجود' },
  { value: 'sold',       label: 'فروخته شده' },
  { value: 'rented',     label: 'اجاره رفته' },
]

// انواع قرارداد
export const CONTRACT_TYPES = [
  { value: 'sale',     label: 'خرید' },
  { value: 'rent',     label: 'اجاره' },
  { value: 'mortgage', label: 'رهن' },
]

// وضعیت قرارداد
export const CONTRACT_STATUS = [
  { value: 'active',    label: 'فعال' },
  { value: 'expired',   label: 'منقضی' },
  { value: 'canceled',  label: 'لغو شده' },
]

// اولویت وظیفه
export const TASK_PRIORITY = [
  { value: 'low',    label: 'کم',    color: 'info' },
  { value: 'medium', label: 'متوسط', color: 'warning' },
  { value: 'high',   label: 'زیاد',  color: 'error' },
]

// وضعیت وظیفه
export const TASK_STATUS = [
  { value: 'pending',     label: 'در انتظار', color: 'warning' },
  { value: 'in_progress', label: 'در حال انجام', color: 'info' },
  { value: 'done',        label: 'انجام شده', color: 'success' },
]

// وضعیت بازدید
export const VISIT_STATUS = [
  { value: 'scheduled', label: 'برنامه‌ریزی شده', color: 'info' },
  { value: 'done',      label: 'انجام شده',     color: 'success' },
  { value: 'canceled',  label: 'لغو شده',       color: 'error' },
]

// نتیجه بازدید
export const VISIT_RESULTS = [
  { value: 'interested',     label: 'علاقه‌مند' },
  { value: 'not_interested', label: 'علاقه‌مند نیست' },
  { value: 'thinking',       label: 'نیاز به فکر' },
]

// بازه‌های زمانی برای فیلتر
export const DATE_RANGES = [
  { value: 'week',  label: 'این هفته' },
  { value: 'month', label: 'این ماه' },
  { value: 'year',  label: 'سال جاری' },
  { value: 'all',   label: 'همه' },
]

// رنگ‌های Badge
export const BADGE_COLORS = {
  gold:    'bg-gold-100 text-gold-800 dark:bg-gold-900/30 dark:text-gold-300',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  error:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  info:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  purple:  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  gray:    'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
}
