// UserForm — مودال فرم افزودن/ویرایش کاربر با اعتبارسنجی
import React, { useState, useEffect, useCallback } from 'react'
import { User as UserIcon, Mail, Phone, KeyRound, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal, { ModalFooter } from '../common/Modal.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import { authService } from '../../services/authService.js'
import { reportService } from '../../services/reportService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { validators } from '../../utils/validators.js'
import { ROLES, ROLE_LABELS } from '../../utils/constants.js'

/**
 * UserForm
 * props:
 *  - open: boolean
 *  - onClose: () => void
 *  - user: object | null (اگر مقدار داشته باشد، حالت ویرایش است)
 *  - onSubmitSuccess: () => void
 */
export default function UserForm({ open, onClose, user = null, onSubmitSuccess }) {
  const { user: currentUser } = useAuth()
  const isEdit = Boolean(user && user.id)

  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'advisor',
    password: '',
    isActive: true,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // پر کردن فرم هنگام ویرایش
  useEffect(() => {
    if (!open) return
    if (user && user.id) {
      setValues({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'advisor',
        password: '',
        isActive: user.isActive !== false,
      })
    } else {
      setValues({
        name: '',
        email: '',
        phone: '',
        role: 'advisor',
        password: '',
        isActive: true,
      })
    }
    setErrors({})
  }, [open, user])

  const setField = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  // اعتبارسنجی تک‌فیلدی هنگام blur
  const validateField = (field) => {
    let err = ''
    if (field === 'name') err = validators.name(values.name)
    else if (field === 'phone') err = validators.phone(values.phone)
    else if (field === 'email') err = validators.email(values.email)
    else if (field === 'password') {
      if (!isEdit) {
        if (!values.password) err = 'رمز عبور اجباری است'
        else if (values.password.length < 6) err = 'رمز عبور باید حداقل ۶ کاراکتر باشد'
      } else if (values.password && values.password.length < 6) {
        err = 'رمز عبور باید حداقل ۶ کاراکتر باشد'
      }
    }
    setErrors((prev) => {
      const next = { ...prev }
      if (err) next[field] = err
      else delete next[field]
      return next
    })
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()

    // اعتبارسنجی نهایی
    const newErrors = {}
    const nameErr = validators.name(values.name)
    if (nameErr) newErrors.name = nameErr
    const phoneErr = validators.phone(values.phone)
    if (phoneErr) newErrors.phone = phoneErr
    if (!values.email) newErrors.email = 'ایمیل اجباری است'
    else {
      const emailErr = validators.email(values.email)
      if (emailErr) newErrors.email = emailErr
    }
    if (!values.role) newErrors.role = 'نقش را انتخاب کنید'
    if (!isEdit) {
      if (!values.password) newErrors.password = 'رمز عبور اجباری است'
      else if (values.password.length < 6) newErrors.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد'
    } else if (values.password && values.password.length < 6) {
      newErrors.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('لطفاً خطاهای فرم را اصلاح کنید')
      return
    }

    setSubmitting(true)
    const tid = toast.loading(isEdit ? 'در حال به‌روزرسانی…' : 'در حال ثبت…')
    try {
      const data = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone,
        role: values.role,
        isActive: !!values.isActive,
      }
      if (!isEdit) {
        data.password = values.password
        data.createdAt = new Date().toISOString()
        await authService.create(data)
        toast.success('کاربر جدید با موفقیت ثبت شد', { id: tid })
        // ثبت فعالیت
        try {
          await reportService.createActivity({
            userId: currentUser?.id,
            action: 'created_user',
            targetType: 'user',
            targetId: null,
            description: `کاربر «${data.name}» با نقش ${ROLE_LABELS[data.role]} اضافه شد`,
            createdAt: new Date().toISOString(),
          })
        } catch {
          /* غیربحرانی */
        }
      } else {
        if (values.password) {
          data.password = values.password
        }
        await authService.update(user.id, data)
        toast.success('کاربر با موفقیت به‌روزرسانی شد', { id: tid })
        try {
          await reportService.createActivity({
            userId: currentUser?.id,
            action: 'updated_user',
            targetType: 'user',
            targetId: user.id,
            description: `اطلاعات کاربر «${data.name}» به‌روزرسانی شد`,
            createdAt: new Date().toISOString(),
          })
        } catch {
          /* غیربحرانی */
        }
      }
      onSubmitSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'خطا در ثبت کاربر', { id: tid })
    } finally {
      setSubmitting(false)
    }
  }

  // گزینه‌های نقش
  const roleOptions = Object.values(ROLES).map((r) => ({
    value: r,
    label: ROLE_LABELS[r],
  }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
      description={isEdit ? 'اطلاعات کاربر را به‌روزرسانی کنید' : 'اطلاعات کاربر جدید را وارد کنید'}
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText={isEdit ? 'به‌روزرسانی' : 'ثبت کاربر'}
          loading={submitting}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="نام و نام خانوادگی"
            placeholder="مثلاً علی محمدی"
            required
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            onBlur={() => validateField('name')}
            error={errors.name}
            leftIcon={<UserIcon className="w-4 h-4" />}
          />
          <Input
            label="شماره موبایل"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            required
            value={values.phone}
            onChange={(e) => setField('phone', e.target.value)}
            onBlur={() => validateField('phone')}
            error={errors.phone}
            inputMode="tel"
            dir="ltr"
            leftIcon={<Phone className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="ایمیل"
            placeholder="email@example.com"
            required
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            onBlur={() => validateField('email')}
            error={errors.email}
            type="email"
            dir="ltr"
            leftIcon={<Mail className="w-4 h-4" />}
          />
          <Select
            label="نقش کاربری"
            required
            options={roleOptions}
            placeholder="انتخاب نقش…"
            value={values.role}
            onChange={(e) => setField('role', e.target.value)}
            error={errors.role}
          />
        </div>

        <Input
          label={isEdit ? 'رمز عبور جدید (اختیاری)' : 'رمز عبور'}
          placeholder={isEdit ? 'برای عدم تغییر خالی بگذارید' : 'حداقل ۶ کاراکتر'}
          type="password"
          showPasswordToggle
          required={!isEdit}
          value={values.password}
          onChange={(e) => setField('password', e.target.value)}
          onBlur={() => validateField('password')}
          error={errors.password}
          hint={isEdit ? 'در صورت پر کردن، رمز قبلی جایگزین می‌شود' : 'حداقل ۶ کاراکتر'}
          leftIcon={<KeyRound className="w-4 h-4" />}
        />

        {/* چک‌باكس وضعیت فعال بودن */}
        <label className="flex items-center gap-3 cursor-pointer press-effect p-3 rounded-xl border border-border hover:bg-surface-muted/40 transition-colors select-none">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => setField('isActive', e.target.checked)}
            className="w-4 h-4 accent-gold-600 cursor-pointer"
          />
          <span className="flex items-center gap-2 text-sm text-content">
            <CheckCircle2 className={`w-4 h-4 ${values.isActive ? 'text-emerald-500' : 'text-content-muted'}`} />
            <span className="font-medium">حساب کاربری فعال است</span>
          </span>
          <span className="text-xs text-content-muted mr-auto">
            {values.isActive ? 'کاربر می‌تواند وارد شود' : 'ورود غیرفعال است'}
          </span>
        </label>

        {/* دکمه مخفی برای submit با Enter */}
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Modal>
  )
}
