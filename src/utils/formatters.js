import moment from 'moment-jalaali'

// فرمت عدد با جداکننده هزارگان (ریال)
export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '۰'
  const num = Number(value)
  if (isNaN(num)) return '۰'
  return num.toLocaleString('fa-IR')
}

// فرمت کوتاه‌تر ارقام بزرگ (مثل ۵ میلیارد)
export function formatCompactCurrency(value) {
  if (value === null || value === undefined || value === '') return '۰'
  const num = Number(value)
  if (isNaN(num)) return '۰'
  if (num >= 1000000000) return `${(num / 1000000000).toLocaleString('fa-IR', { maximumFractionDigits: 2 })} میلیارد`
  if (num >= 1000000) return `${(num / 1000000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیون`
  return num.toLocaleString('fa-IR')
}

// فرمت عدد ساده
export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '۰'
  const num = Number(value)
  if (isNaN(num)) return '۰'
  return num.toLocaleString('fa-IR')
}

// تبدیل تاریخ میلادی به شمسی (تاریخ کامل)
export function toJalali(dateStr, format = 'jYYYY/jMM/jDD') {
  if (!dateStr) return '—'
  try {
    return moment(dateStr).format(format)
  } catch {
    return '—'
  }
}

// تبدیل به شمسی با ساعت
export function toJalaliDateTime(dateStr) {
  if (!dateStr) return '—'
  try {
    return moment(dateStr).format('jYYYY/jMM/jDD - HH:mm')
  } catch {
    return '—'
  }
}

// تبدیل به شمسی فقط ساعت
export function toJalaliTime(dateStr) {
  if (!dateStr) return '—'
  try {
    return moment(dateStr).format('HH:mm')
  } catch {
    return '—'
  }
}

// نام ماه شمسی
export function jalaliMonthName(dateStr) {
  if (!dateStr) return ''
  try {
    return moment(dateStr).format('jMMMM')
  } catch {
    return ''
  }
}

// محاسبه زمان نسبی (مثلا: ۳ ساعت پیش)
export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const then = new Date(dateStr)
  const diff = Math.floor((now - then) / 1000) // ثانیه

  if (diff < 60) return 'لحظاتی پیش'
  if (diff < 3600) return `${Math.floor(diff / 60).toLocaleString('fa-IR')} دقیقه پیش`
  if (diff < 86400) return `${Math.floor(diff / 3600).toLocaleString('fa-IR')} ساعت پیش`
  if (diff < 604800) return `${Math.floor(diff / 86400).toLocaleString('fa-IR')} روز پیش`
  return toJalali(dateStr)
}

// تولید ID منحصربه‌فردي برای رکوردهای جدید
export function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000)
}

// تولید کد ملک
export function generatePropertyCode(existingCount = 0) {
  const next = (existingCount + 1).toString().padStart(4, '0')
  return `PROP-${next}`
}

// تولید کد قرارداد
export function generateContractCode(existingCount = 0) {
  const next = (existingCount + 1).toString().padStart(4, '0')
  return `CNT-${next}`
}

// برش متن طولانی
export function truncate(text, length = 40) {
  if (!text) return ''
  if (text.length <= length) return text
  return text.slice(0, length) + '…'
}

// دریافت حروف اول نام
export function getInitials(name = '') {
  if (!name) return '؟'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 1)
  return parts[0].slice(0, 1) + parts[1].slice(0, 1)
}
