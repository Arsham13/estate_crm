// CustomerForm — مودال فرم افزودن/ویرایش مشتری با اعتبارسنجی و قالب‌بندی بودجه
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Users as UsersIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal, { ModalFooter } from '../common/Modal.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import Textarea from '../common/Textarea.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { customerService } from '../../services/customerService.js'
import { authService } from '../../services/authService.js'
import { reportService } from '../../services/reportService.js'
import { validateCustomer, validators } from '../../utils/validators.js'
import { CUSTOMER_TYPES, CUSTOMER_SOURCES, PIPELINE_STAGES } from '../../utils/constants.js'

// قالب‌بندی عدد با جداکننده هزارگان (فارسی ورودی به انگلیسی تبدیل می‌شود)
function toEnglishDigits(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/[\u06F0-\u06F9]/g, (d) => d.charCodeAt(0) - 0x06f0)
    .replace(/[\u0660-\u0669]/g, (d) => d.charCodeAt(0) - 0x0660)
    .replace(/[,،\s]/g, '')
}

function formatBudgetDisplay(value) {
  if (value === '' || value === null || value === undefined) return ''
  const num = Number(value)
  if (isNaN(num)) return ''
  return num.toLocaleString('fa-IR')
}

/**
 * CustomerForm
 * props:
 *  - open: boolean
 *  - onClose: () => void
 *  - customer: object | null (اگر مقدار داشته باشد، حالت ویرایش است)
 *  - onSubmitSuccess: () => void (برای رفرش لیست)
 */
export default function CustomerForm({ open, onClose, customer = null, onSubmitSuccess }) {
  const { user, hasRole } = useAuth()
  const isAdmin = hasRole(['admin'])

  const [advisors, setAdvisors] = useState([])
  const [loadingAdvisors, setLoadingAdvisors] = useState(false)

  const [values, setValues] = useState({
    name: '',
    phone: '',
    email: '',
    type: '',
    source: '',
    budget: '',
    assignedTo: '',
    pipelineStage: 'new',
    note: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // واکشی لیست مشاوران (فقط برای ادمین)
  useEffect(() => {
    if (!open || !isAdmin) return
    let active = true
    setLoadingAdvisors(true)
    authService
      .getAll()
      .then((users) => {
        if (!active) return
        const list = (users || []).filter((u) => u.role === 'advisor' && u.isActive)
        setAdvisors(list)
      })
      .catch(() => {
        if (active) setAdvisors([])
      })
      .finally(() => {
        if (active) setLoadingAdvisors(false)
      })
    return () => {
      active = false
    }
  }, [open, isAdmin])

  const isEdit = Boolean(customer && customer.id)

  // پر کردن فرم هنگام ویرایش
  useEffect(() => {
    if (!open) return
    if (customer && customer.id) {
      setValues({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        type: customer.type || '',
        source: customer.source || '',
        budget: customer.budget != null ? String(customer.budget) : '',
        assignedTo: customer.assignedTo != null ? String(customer.assignedTo) : '',
        pipelineStage: customer.pipelineStage || 'new',
        note: customer.note || '',
      })
    } else {
      setValues({
        name: '',
        phone: '',
        email: '',
        type: '',
        source: '',
        budget: '',
        assignedTo: isAdmin ? '' : String(user?.id || ''),
        pipelineStage: 'new',
        note: '',
      })
    }
    setErrors({})
  }, [open, customer, isAdmin, user])

  const advisorOptions = useMemo(
    () => advisors.map((a) => ({ value: String(a.id), label: a.name })),
    [advisors]
  )

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
    else if (field === 'budget') {
      if (values.budget !== '') {
        const num = Number(toEnglishDigits(values.budget))
        if (isNaN(num) || num < 0) err = 'بودجه باید عدد معتبر باشد'
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

    // آماده‌سازی مقادیر نهایی برای اعتبارسنجی
    const payload = {
      ...values,
      budget: values.budget ? Number(toEnglishDigits(values.budget)) : null,
      assignedTo: values.assignedTo ? Number(values.assignedTo) : '',
    }

    const validationErrors = validateCustomer(payload)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error('لطفاً خطاهای فرم را اصلاح کنید')
      return
    }

    setSubmitting(true)
    const tid = toast.loading(isEdit ? 'در حال به‌روزرسانی…' : 'در حال ثبت…')
    try {
      const data = {
        name: payload.name.trim(),
        phone: payload.phone,
        email: payload.email?.trim() || '',
        type: payload.type,
        source: payload.source,
        budget: payload.budget || 0,
        assignedTo: payload.assignedTo,
        pipelineStage: payload.pipelineStage || 'new',
        note: payload.note?.trim() || '',
      }

      if (isEdit) {
        await customerService.update(customer.id, data)
        toast.success('مشتری با موفقیت به‌روزرسانی شد', { id: tid })
      } else {
        data.createdAt = new Date().toISOString()
        await customerService.create(data)
        toast.success('مشتری جدید با موفقیت ثبت شد', { id: tid })
        // ثبت فعالیت
        try {
          await reportService.createActivity({
            userId: user?.id,
            action: 'created_customer',
            description: `مشتری «${data.name}» اضافه شد`,
            entityType: 'customer',
            entityId: null,
            createdAt: new Date().toISOString(),
          })
        } catch {
          /* غیربحرانی */
        }
      }
      onSubmitSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'خطا در ثبت مشتری', { id: tid })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'ویرایش مشتری' : 'افزودن مشتری جدید'}
      description={isEdit ? 'اطلاعات مشتری را به‌روزرسانی کنید' : 'اطلاعات مشتری جدید را وارد کنید'}
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText={isEdit ? 'به‌روزرسانی' : 'ثبت مشتری'}
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
            leftIcon={<UsersIcon className="w-4 h-4" />}
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
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="ایمیل"
            placeholder="email@example.com"
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            onBlur={() => validateField('email')}
            error={errors.email}
            type="email"
            dir="ltr"
          />
          <Input
            label="بودجه (تومان)"
            placeholder="مثلاً ۵٬۰۰۰٬۰۰۰٬۰۰۰"
            value={formatBudgetDisplay(values.budget)}
            onChange={(e) => {
              const raw = toEnglishDigits(e.target.value)
              if (raw === '' || /^\d+$/.test(raw)) setField('budget', raw)
            }}
            onBlur={() => validateField('budget')}
            error={errors.budget}
            hint="قیمت به تومان وارد شود"
            inputMode="numeric"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="نوع مشتری"
            required
            options={CUSTOMER_TYPES}
            placeholder="انتخاب نوع…"
            value={values.type}
            onChange={(e) => setField('type', e.target.value)}
            error={errors.type}
          />
          <Select
            label="منبع آشنایی"
            required
            options={CUSTOMER_SOURCES}
            placeholder="نحوه آشنایی…"
            value={values.source}
            onChange={(e) => setField('source', e.target.value)}
            error={errors.source}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="مرحله پایپ‌لاین"
            options={PIPELINE_STAGES.map((s) => ({ value: s.value, label: s.label }))}
            placeholder="انتخاب مرحله…"
            value={values.pipelineStage}
            onChange={(e) => setField('pipelineStage', e.target.value)}
          />
          {isAdmin ? (
            <Select
              label="مشاور مسئول"
              required
              options={advisorOptions}
              placeholder={loadingAdvisors ? 'در حال بارگذاری…' : 'انتخاب مشاور…'}
              value={values.assignedTo}
              onChange={(e) => setField('assignedTo', e.target.value)}
              error={errors.assignedTo}
            />
          ) : (
            <Input
              label="مشاور مسئول"
              value={user?.name || '—'}
              disabled
              hint="به شما اختصاص داده می‌شود"
            />
          )}
        </div>

        <Textarea
          label="یادداشت"
          rows={3}
          placeholder="توضیحات اضافی درباره مشتری…"
          value={values.note}
          onChange={(e) => setField('note', e.target.value)}
        />

        {/* دکمه مخفی برای submit با Enter */}
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Modal>
  )
}
