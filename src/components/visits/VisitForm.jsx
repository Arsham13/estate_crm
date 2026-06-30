// VisitForm — مودال فرم افزودن/ویرایش بازدید با اعتبارسنجی و انتخاب مشتری/ملک/مشاور
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal, { ModalFooter } from '../common/Modal.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import Textarea from '../common/Textarea.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { visitService } from '../../services/visitService.js'
import { customerService } from '../../services/customerService.js'
import { propertyService } from '../../services/propertyService.js'
import { authService } from '../../services/authService.js'
import { reportService } from '../../services/reportService.js'
import { validateVisit } from '../../utils/validators.js'
import { VISIT_STATUS, VISIT_RESULTS } from '../../utils/constants.js'

// تبدیل ISO به YYYY-MM-DDTHH:mm برای input[type=datetime-local]
function isoToDateTimeInput(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

const EMPTY = {
  customerId: '',
  propertyId: '',
  advisorId: '',
  date: '',
  status: 'scheduled',
  result: '',
  notes: '',
}

/**
 * VisitForm
 * props:
 *  - open
 *  - onClose
 *  - visit: object | null
 *  - defaultDate: ISO string | null  (پیش‌پر کردن تاریخ بازدید در حالت ایجاد جدید)
 *  - onSubmitSuccess: () => void
 */
export default function VisitForm({ open, onClose, visit = null, defaultDate, onSubmitSuccess }) {
  const { user, hasRole } = useAuth()
  const isAdmin = hasRole(['admin'])

  const [customers, setCustomers] = useState([])
  const [properties, setProperties] = useState([])
  const [advisors, setAdvisors] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const isEdit = Boolean(visit && visit.id)

  useEffect(() => {
    if (!open) return
    let active = true
    setLoadingOptions(true)
    Promise.all([
      customerService.getAll({ _limit: 1000 }).catch(() => []),
      propertyService.getAll({ _limit: 1000 }).catch(() => []),
      authService.getAll().catch(() => []),
    ])
      .then(([c, p, u]) => {
        if (!active) return
        const custList = Array.isArray(c) ? c : []
        const propList = Array.isArray(p) ? p : []
        const userList = Array.isArray(u) ? u : []
        setCustomers(isAdmin ? custList : custList.filter((x) => x.assignedTo === user?.id))
        setProperties(isAdmin ? propList : propList.filter((x) => x.assignedTo === user?.id))
        setAdvisors(userList.filter((x) => x.role === 'advisor' && x.isActive))
      })
      .finally(() => active && setLoadingOptions(false))
    return () => {
      active = false
    }
  }, [open, isAdmin, user])

  useEffect(() => {
    if (!open) return
    if (visit && visit.id) {
      setValues({
        customerId: visit.customerId != null ? String(visit.customerId) : '',
        propertyId: visit.propertyId != null ? String(visit.propertyId) : '',
        advisorId: visit.advisorId != null ? String(visit.advisorId) : '',
        date: isoToDateTimeInput(visit.date),
        status: visit.status || 'scheduled',
        result: visit.result || '',
        notes: visit.notes || '',
      })
    } else {
      setValues({
        ...EMPTY,
        date: defaultDate ? isoToDateTimeInput(defaultDate) : '',
        advisorId: isAdmin ? '' : String(user?.id || ''),
        status: 'scheduled',
      })
    }
    setErrors({})
  }, [open, visit, isAdmin, user, defaultDate])

  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: String(c.id), label: `${c.name} — ${c.phone}` })),
    [customers]
  )

  const propertyOptions = useMemo(
    () =>
      properties.map((p) => ({
        value: String(p.id),
        label: `${p.code || `#${p.id}`} — ${p.address ? p.address.slice(0, 40) : ''}`,
      })),
    [properties]
  )

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

  const handleSubmit = async (e) => {
    e?.preventDefault?.()

    const payload = {
      ...values,
      customerId: values.customerId ? Number(values.customerId) : '',
      propertyId: values.propertyId ? Number(values.propertyId) : '',
      advisorId: values.advisorId ? Number(values.advisorId) : '',
    }

    const validationErrors = validateVisit(payload)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error('لطفاً خطاهای فرم را اصلاح کنید')
      return
    }

    setSubmitting(true)
    const tid = toast.loading(isEdit ? 'در حال به‌روزرسانی…' : 'در حال ثبت…')
    try {
      const dateIso = values.date ? new Date(values.date).toISOString() : null

      const data = {
        customerId: payload.customerId,
        propertyId: payload.propertyId,
        advisorId: payload.advisorId,
        date: dateIso,
        status: payload.status,
        result: payload.result || null,
        notes: (payload.notes || '').trim(),
      }

      if (isEdit) {
        await visitService.update(visit.id, data)
        toast.success('بازدید با موفقیت به‌روزرسانی شد', { id: tid })
      } else {
        data.createdAt = new Date().toISOString()
        const created = await visitService.create(data)
        try {
          await reportService.createActivity({
            userId: user?.id,
            action: 'scheduled_visit',
            description: `بازدید برای مشتری «${resolveCustomerName(payload.customerId) || ''}» برنامه‌ریزی شد`,
            entityType: 'visit',
            entityId: created?.id || null,
            createdAt: new Date().toISOString(),
          })
        } catch {
          /* غیربحرانی */
        }
        toast.success('بازدید جدید با موفقیت ثبت شد', { id: tid })
      }
      onSubmitSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'خطا در ثبت بازدید', { id: tid })
    } finally {
      setSubmitting(false)
    }
  }

  // کمک‌تابع برای resolve نام مشتری جهت ثبت در فعالیت
  function resolveCustomerName(id) {
    const c = customers.find((x) => x.id === Number(id))
    return c?.name || ''
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'ویرایش بازدید' : 'افزودن بازدید جدید'}
      description={isEdit ? 'اطلاعات بازدید را به‌روزرسانی کنید' : 'اطلاعات بازدید جدید را وارد کنید'}
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText={isEdit ? 'به‌روزرسانی' : 'ثبت بازدید'}
          loading={submitting}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* مشتری + ملک */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="مشتری"
            required
            options={customerOptions}
            placeholder={loadingOptions ? 'در حال بارگذاری…' : 'انتخاب مشتری…'}
            value={values.customerId}
            onChange={(e) => setField('customerId', e.target.value)}
            error={errors.customerId}
          />
          <Select
            label="ملک"
            required
            options={propertyOptions}
            placeholder={loadingOptions ? 'در حال بارگذاری…' : 'انتخاب ملک…'}
            value={values.propertyId}
            onChange={(e) => setField('propertyId', e.target.value)}
            error={errors.propertyId}
          />
        </div>

        {/* مشاور مسئول */}
        <div className="grid grid-cols-1 gap-4">
          {isAdmin ? (
            <Select
              label="مشاور مسئول"
              required
              options={advisorOptions}
              placeholder={loadingOptions ? 'در حال بارگذاری…' : 'انتخاب مشاور…'}
              value={values.advisorId}
              onChange={(e) => setField('advisorId', e.target.value)}
              error={errors.advisorId}
            />
          ) : (
            <Input label="مشاور مسئول" value={user?.name || '—'} disabled hint="به شما اختصاص داده می‌شود" />
          )}
        </div>

        {/* تاریخ + وضعیت + نتیجه */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="تاریخ و ساعت بازدید"
            type="datetime-local"
            required
            value={values.date}
            onChange={(e) => setField('date', e.target.value)}
            error={errors.date}
            leftIcon={<CalendarClock className="w-4 h-4" />}
          />
          <Select
            label="وضعیت"
            required
            options={VISIT_STATUS.map((s) => ({ value: s.value, label: s.label }))}
            placeholder="انتخاب…"
            value={values.status}
            onChange={(e) => setField('status', e.target.value)}
            error={errors.status}
          />
          <Select
            label="نتیجه (اختیاری)"
            options={VISIT_RESULTS.map((r) => ({ value: r.value, label: r.label }))}
            placeholder="بدون نتیجه…"
            value={values.result}
            onChange={(e) => setField('result', e.target.value)}
          />
        </div>

        {/* یادداشت */}
        <Textarea
          label="یادداشت"
          rows={3}
          placeholder="توضیحات اضافی درباره بازدید…"
          value={values.notes}
          onChange={(e) => setField('notes', e.target.value)}
        />

        {/* دکمه مخفی برای submit با Enter */}
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Modal>
  )
}
