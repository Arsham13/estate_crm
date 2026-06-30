// توابع کمکی عمومی

// دیبونس (فاصله‌انداختن بین فراخوانی‌های مکرر)
export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// فیلتر بازه زمانی برای آرایه‌ها
export function filterByDateRange(items, dateField, rangeKey) {
  if (!rangeKey || rangeKey === 'all') return items
  const now = new Date()
  let startDate
  if (rangeKey === 'week') {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - 7)
  } else if (rangeKey === 'month') {
    startDate = new Date(now)
    startDate.setMonth(now.getMonth() - 1)
  } else if (rangeKey === 'year') {
    startDate = new Date(now)
    startDate.setFullYear(now.getFullYear() - 1)
  } else {
    return items
  }
  return items.filter((item) => {
    const d = new Date(item[dateField])
    return d >= startDate && d <= now
  })
}

// مرتب‌سازی آرایه بر اساس فیلد
export function sortByField(items, field, direction = 'asc') {
  const sorted = [...items].sort((a, b) => {
    const av = a[field]
    const bv = b[field]
    if (av === null || av === undefined) return 1
    if (bv === null || bv === undefined) return -1
    if (typeof av === 'number' && typeof bv === 'number') return av - bv
    return String(av).localeCompare(String(bv), 'fa')
  })
  return direction === 'desc' ? sorted.reverse() : sorted
}

// نمایش لیبل از روی آرایه گزینه‌ها
export function getLabel(options = [], value) {
  const found = options.find((o) => o.value === value)
  return found ? found.label : value || '—'
}

// رنگ از روی آرایه گزینه‌ها (برای badge)
export function getColor(options = [], value, fallback = 'gray') {
  const found = options.find((o) => o.value === value)
  return found?.color || fallback
}

// بررسی دسترسی به صفحه
export function canAccessPage(role, pageKey) {
  const access = {
    admin: ['dashboard', 'customers', 'properties', 'contracts', 'tasks', 'visits', 'pipeline', 'calendar', 'reports', 'settings'],
    advisor: ['dashboard', 'customers', 'properties', 'contracts', 'tasks', 'visits', 'pipeline', 'calendar', 'reports'],
    assistant: ['dashboard', 'customers', 'properties', 'contracts', 'tasks', 'visits', 'pipeline', 'calendar'],
  }
  return (access[role] || []).includes(pageKey)
}

// گرفتن ایموجی برای آیکون (در صورت نیاز)
export function classByColor(color) {
  const map = {
    gold: 'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
  }
  return map[color] || map.gray
}

// تابع برای استخراج متن از رویداد کلیک یا کیبورد
export function isEnterOrSpace(e) {
  return e.key === 'Enter' || e.key === ' '
}
