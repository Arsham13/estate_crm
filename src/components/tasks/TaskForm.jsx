// TaskForm — مودال فرم افزودن/ویرایش وظیفه با اعتبارسنجی و انتخاب مشتری/ملک اختیاری
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { CheckSquare, CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal, { ModalFooter } from '../common/Modal.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import Textarea from '../common/Textarea.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { taskService } from '../../services/taskService.js'
import { customerService } from '../../services/customerService.js'
import { propertyService } from '../../services/propertyService.js'
import { authService } from '../../services/authService.js'
import { reportService } from '../../services/reportService.js'
import { validateTask, validators } from '../../utils/validators.js'
import { TASK_PRIORITY, TASK_STATUS } from '../../utils/constants.js'

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
  title: '',
  description: '',
  dueDate: '',
  priority: 'medium',
  status: 'pending',
  customerId: '',
  propertyId: '',
  assignedTo: '',
}

/**
 * TaskForm
 * props:
 *  - open
 *  - onClose
 *  - task: object | null
 *  - defaultDueDate: ISO string | null  (پیش‌پر کردن تاریخ سررسید در حالت ایجاد جدید)
 *  - onSubmitSuccess: () => void
 */
export default function TaskForm({ open, onClose, task = null, defaultDueDate, onSubmitSuccess }) {
  const { user, hasRole } = useAuth()
  const isAdmin = hasRole(['admin'])

  const [customers, setCustomers] = useState([])
  const [properties, setProperties] = useState([])
  const [advisors, setAdvisors] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const isEdit = Boolean(task && task.id)

  // واکشی گزینه‌ها هنگام باز شدن
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

  // پر کردن فرم هنگام باز شدن
  useEffect(() => {
    if (!open) return
    if (task && task.id) {
      setValues({
        title: task.title || '',
        description: task.description || '',
        dueDate: isoToDateTimeInput(task.dueDate),
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        customerId: task.customerId != null ? String(task.customerId) : '',
        propertyId: task.propertyId != null ? String(task.propertyId) : '',
        assignedTo: task.assignedTo != null ? String(task.assignedTo) : '',
      })
    } else {
      setValues({
        ...EMPTY,
        dueDate: defaultDueDate ? isoToDateTimeInput(defaultDueDate) : '',
        assignedTo: isAdmin ? '' : String(user?.id || ''),
      })
    }
    setErrors({})
  }, [open, task, isAdmin, user, defaultDueDate])

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

  const validateField = (field) => {
    let err = ''
    if (field === 'title') err = validators.required(values.title)
    else if (field === 'dueDate') err = validators.required(values.dueDate)
    setErrors((prev) => {
      const next = { ...prev }
      if (err) next[field] = err
      else delete next[field]
      return next
    })
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()

    const payload = {
      ...values,
      customerId: values.customerId ? Number(values.customerId) : null,
      propertyId: values.propertyId ? Number(values.propertyId) : null,
      assignedTo: values.assignedTo ? Number(values.assignedTo) : '',
    }

    const validationErrors = validateTask(payload)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error('لطفاً خطاهای فرم را اصلاح کنید')
      return
    }

    setSubmitting(true)
    const tid = toast.loading(isEdit ? 'در حال به‌روزرسانی…' : 'در حال ثبت…')
    try {
      // تبدیل datetime-local به ISO کامل
      const dueDateIso = values.dueDate ? new Date(values.dueDate).toISOString() : null

      const data = {
        title: payload.title.trim(),
        description: (payload.description || '').trim(),
        dueDate: dueDateIso,
        priority: payload.priority,
        status: payload.status,
        customerId: payload.customerId || null,
        propertyId: payload.propertyId || null,
        assignedTo: payload.assignedTo,
      }

      if (isEdit) {
        await taskService.update(task.id, data)
        toast.success('وظیفه با موفقیت به‌روزرسانی شد', { id: tid })
      } else {
        data.createdAt = new Date().toISOString()
        const created = await taskService.create(data)
        try {
          await reportService.createActivity({
            userId: user?.id,
            action: 'created_task',
            description: `وظیفه «${data.title}» ثبت شد`,
            entityType: 'task',
            entityId: created?.id || null,
            createdAt: new Date().toISOString(),
          })
        } catch {
          /* غیربحرانی */
        }
        toast.success('وظیفه جدید با موفقیت ثبت شد', { id: tid })
      }
      onSubmitSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'خطا در ثبت وظیفه', { id: tid })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'ویرایش وظیفه' : 'افزودن وظیفه جدید'}
      description={isEdit ? task?.title : 'اطلاعات وظیفه جدید را وارد کنید'}
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText={isEdit ? 'به‌روزرسانی' : 'ثبت وظیفه'}
          loading={submitting}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* عنوان */}
        <Input
          label="عنوان"
          placeholder="مثلاً: تماس با مشتری برای هماهنگی بازدید"
          required
          value={values.title}
          onChange={(e) => setField('title', e.target.value)}
          onBlur={() => validateField('title')}
          error={errors.title}
          leftIcon={<CheckSquare className="w-4 h-4" />}
        />

        {/* توضیحات */}
        <Textarea
          label="توضیحات"
          rows={3}
          placeholder="جزئیات وظیفه…"
          value={values.description}
          onChange={(e) => setField('description', e.target.value)}
        />

        {/* سررسید + اولویت + وضعیت */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="تاریخ سررسید"
            type="datetime-local"
            required
            value={values.dueDate}
            onChange={(e) => setField('dueDate', e.target.value)}
            onBlur={() => validateField('dueDate')}
            error={errors.dueDate}
            leftIcon={<CalendarClock className="w-4 h-4" />}
          />
          <Select
            label="اولویت"
            required
            options={TASK_PRIORITY.map((p) => ({ value: p.value, label: p.label }))}
            placeholder="انتخاب…"
            value={values.priority}
            onChange={(e) => setField('priority', e.target.value)}
            error={errors.priority}
          />
          <Select
            label="وضعیت"
            required
            options={TASK_STATUS.map((s) => ({ value: s.value, label: s.label }))}
            placeholder="انتخاب…"
            value={values.status}
            onChange={(e) => setField('status', e.target.value)}
            error={errors.status}
          />
        </div>

        {/* مشتری + ملک (اختیاری) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="مشتری (اختیاری)"
            options={customerOptions}
            placeholder={loadingOptions ? 'در حال بارگذاری…' : 'بدون انتخاب…'}
            value={values.customerId}
            onChange={(e) => setField('customerId', e.target.value)}
          />
          <Select
            label="ملک (اختیاری)"
            options={propertyOptions}
            placeholder={loadingOptions ? 'در حال بارگذاری…' : 'بدون انتخاب…'}
            value={values.propertyId}
            onChange={(e) => setField('propertyId', e.target.value)}
          />
        </div>

        {/* مشاور مسئول */}
        <div className="grid grid-cols-1 gap-4">
          {isAdmin ? (
            <Select
              label="محول شده به"
              required
              options={advisorOptions}
              placeholder={loadingOptions ? 'در حال بارگذاری…' : 'انتخاب مشاور…'}
              value={values.assignedTo}
              onChange={(e) => setField('assignedTo', e.target.value)}
              error={errors.assignedTo}
            />
          ) : (
            <Input label="محول شده به" value={user?.name || '—'} disabled hint="به شما اختصاص داده می‌شود" />
          )}
        </div>

        {/* دکمه مخفی برای submit با Enter */}
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Modal>
  )
}
