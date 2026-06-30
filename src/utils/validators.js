// قوانین اعتبارسنجی فرم‌ها

export const validators = {
  // نام: حداقل ۲ حرف، فقط حروف فارسی/انگلیسی و فاصله
  name: (v) => {
    if (!v || !v.trim()) return 'این فیلد اجباری است'
    if (v.trim().length < 2) return 'نام باید حداقل ۲ حرف باشد'
    if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(v.trim())) return 'فقط حروف فارسی/انگلیسی مجاز است'
    return ''
  },

  // موبایل: ۱۱ رقم شروع با ۰۹
  phone: (v) => {
    if (!v) return 'این فیلد اجباری است'
    if (!/^09\d{9}$/.test(v)) return 'شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)'
    return ''
  },

  // ایمیل: اختیاری اما در صورت ورود باید معتبر باشد
  email: (v) => {
    if (!v) return ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'فرمت ایمیل صحیح نیست'
    return ''
  },

  // عدد مثبت
  positiveNumber: (v) => {
    if (v === '' || v === null || v === undefined) return 'این فیلد اجباری است'
    const num = Number(v)
    if (isNaN(num)) return 'عدد معتبر وارد کنید'
    if (num <= 0) return 'باید عدد مثبت باشد'
    return ''
  },

  // عدد اختیاری
  optionalNumber: (v) => {
    if (v === '' || v === null || v === undefined) return ''
    const num = Number(v)
    if (isNaN(num)) return 'عدد معتبر وارد کنید'
    return ''
  },

  // اجباری ساده
  required: (v) => {
    if (v === '' || v === null || v === undefined) return 'این فیلد اجباری است'
    if (typeof v === 'string' && !v.trim()) return 'این فیلد اجباری است'
    return ''
  },

  // حداقل طول
  minLength: (n) => (v) => {
    if (!v) return 'این فیلد اجباری است'
    if (v.length < n) return `حداقل ${n} کاراکتر لازم است`
    return ''
  },

  // تأیید رمز عبور
  matchPassword: (other) => (v) => {
    if (!v) return 'تکرار رمز اجباری است'
    if (v !== other) return 'رمزها مطابقت ندارند'
    return ''
  },
}

// اعتبارسنجی فرم مشتری
export function validateCustomer(values) {
  const errors = {}
  const nameErr = validators.name(values.name)
  if (nameErr) errors.name = nameErr
  const phoneErr = validators.phone(values.phone)
  if (phoneErr) errors.phone = phoneErr
  const emailErr = validators.email(values.email)
  if (emailErr) errors.email = emailErr
  if (!values.type) errors.type = 'نوع مشتری را انتخاب کنید'
  if (!values.source) errors.source = 'منبع آشنایی را انتخاب کنید'
  if (!values.assignedTo) errors.assignedTo = 'مشاور مسئول را انتخاب کنید'
  return errors
}

// اعتبارسنجی فرم ملک
export function validateProperty(values) {
  const errors = {}
  if (!values.address || !values.address.trim()) errors.address = 'آدرس اجباری است'
  const areaErr = validators.positiveNumber(values.area)
  if (areaErr) errors.area = areaErr
  const priceErr = validators.positiveNumber(values.price)
  if (priceErr) errors.price = priceErr
  if (!values.type) errors.type = 'نوع ملک را انتخاب کنید'
  if (!values.dealType) errors.dealType = 'نوع معامله را انتخاب کنید'
  if (!values.status) errors.status = 'وضعیت ملک را انتخاب کنید'
  if (!values.assignedTo) errors.assignedTo = 'مشاور مسئول را انتخاب کنید'
  return errors
}

// اعتبارسنجی فرم قرارداد
export function validateContract(values) {
  const errors = {}
  if (!values.type) errors.type = 'نوع قرارداد را انتخاب کنید'
  if (!values.customerId) errors.customerId = 'مشتری را انتخاب کنید'
  if (!values.propertyId) errors.propertyId = 'ملک را انتخاب کنید'
  if (!values.advisorId) errors.advisorId = 'مشاور را انتخاب کنید'
  if (!values.startDate) errors.startDate = 'تاریخ شروع اجباری است'
  if (!values.endDate) errors.endDate = 'تاریخ پایان اجباری است'
  if (values.startDate && values.endDate && new Date(values.endDate) <= new Date(values.startDate)) {
    errors.endDate = 'تاریخ پایان باید بعد از تاریخ شروع باشد'
  }
  const amountErr = validators.positiveNumber(values.amount)
  if (amountErr) errors.amount = amountErr
  const commissionErr = validators.positiveNumber(values.commission)
  if (commissionErr) errors.commission = commissionErr
  if (!values.status) errors.status = 'وضعیت را انتخاب کنید'
  return errors
}

// اعتبارسنجی فرم وظیفه
export function validateTask(values) {
  const errors = {}
  if (!values.title || !values.title.trim()) errors.title = 'عنوان اجباری است'
  if (!values.dueDate) errors.dueDate = 'تاریخ سررسید اجباری است'
  if (!values.priority) errors.priority = 'اولویت را انتخاب کنید'
  if (!values.status) errors.status = 'وضعیت را انتخاب کنید'
  if (!values.assignedTo) errors.assignedTo = 'مشاور را انتخاب کنید'
  return errors
}

// اعتبارسنجی فرم بازدید
export function validateVisit(values) {
  const errors = {}
  if (!values.customerId) errors.customerId = 'مشتری را انتخاب کنید'
  if (!values.propertyId) errors.propertyId = 'ملک را انتخاب کنید'
  if (!values.advisorId) errors.advisorId = 'مشاور را انتخاب کنید'
  if (!values.date) errors.date = 'تاریخ بازدید اجباری است'
  if (!values.status) errors.status = 'وضعیت را انتخاب کنید'
  return errors
}
