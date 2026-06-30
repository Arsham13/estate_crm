// ContractForm — مودال فرم افزودن/ویرایش قرارداد با اعتبارسنجی، قالب‌بندی مبلغ/کمیسیون و کد خودکار
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal, { ModalFooter } from '../common/Modal.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import Textarea from '../common/Textarea.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { contractService } from '../../services/contractService.js'
import { customerService } from '../../services/customerService.js'
import { propertyService } from '../../services/propertyService.js'
import { authService } from '../../services/authService.js'
import { reportService } from '../../services/reportService.js'
import { validateContract, validators } from '../../utils/validators.js'
import { CONTRACT_TYPES, CONTRACT_STATUS } from '../../utils/constants.js'
import { generateContractCode } from '../../utils/formatters.js'

// تبدیل ارقام فارسی/عربی به انگلیسی و حذف جداکننده‌ها
function toEnglishDigits(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/[\u06F0-\u06F9]/g, (d) => d.charCodeAt(0) - 0x06f0)
    .replace(/[\u0660-\u0669]/g, (d) => d.charCodeAt(0) - 0x0660)
    .replace(/[,،\s]/g, '')
}

function formatNumberDisplay(value) {
  if (value === '' || value === null || value === undefined) return ''
  const num = Number(value)
  if (isNaN(num)) return ''
  return num.toLocaleString('fa-IR')
}

// تبدیل ISO به YYYY-MM-DD برای input[type=date]
function isoToDateInput(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

const EMPTY = {
  code: '',
  type: '',
  customerId: '',
  propertyId: '',
  advisorId: '',
  startDate: '',
  endDate: '',
  amount: '',
  commission: '',
  status: 'active',
  note: '',
}

/**
 * ContractForm
 * props:
 *  - open
 *  - onClose
 *  - contract: object | null (اگر مقدار داشته باشد، حالت ویرایش است)
 *  - onSubmitSuccess: () => void
 */
export default function ContractForm({ open, onClose, contract = null, onSubmitSuccess }) {
  const { user, hasRole } = useAuth()
  const isAdmin = hasRole(['admin'])

  const [customers, setCustomers] = useState([])
  const [properties, setProperties] = useState([])
  const [advisors, setAdvisors] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const isEdit = Boolean(contract && contract.id)

  // واکشی لیست مشتریان، ملک‌ها و مشاوران هنگام باز شدن مودال
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
        // برای مشاور غیر ادمین، فقط مشتریان/ملک‌های خودش در لیست
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
    if (contract && contract.id) {
      setValues({
        code: contract.code || '',
        type: contract.type || '',
        customerId: contract.customerId != null ? String(contract.customerId) : '',
        propertyId: contract.propertyId != null ? String(contract.propertyId) : '',
        advisorId: contract.advisorId != null ? String(contract.advisorId) : '',
        startDate: isoToDateInput(contract.startDate),
        endDate: isoToDateInput(contract.endDate),
        amount: contract.amount != null ? String(contract.amount) : '',
        commission: contract.commission != null ? String(contract.commission) : '',
        status: contract.status || 'active',
        note: contract.note || '',
      })
    } else {
      setValues({
        ...EMPTY,
        advisorId: isAdmin ? '' : String(user?.id || ''),
        status: 'active',
      })
    }
    setErrors({})
  }, [open, contract, isAdmin, user])

  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        value: String(c.id),
        label: `${c.name} — ${c.phone}`,
      })),
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

  // اعتبارسنجی تک‌فیلدی هنگام blur
  const validateField = (field) => {
    let err = ''
    if (field === 'amount') err = validators.positiveNumber(values.amount)
    else if (field === 'commission') err = validators.positiveNumber(values.commission)
    else if (field === 'startDate') err = validators.required(values.startDate)
    else if (field === 'endDate') {
      err = validators.required(values.endDate)
      if (!err && values.startDate && new Date(values.endDate) <= new Date(values.startDate)) {
        err = 'تاریخ پایان باید بعد از تاریخ شروع باشد'
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

    const payload = {
      ...values,
      amount: values.amount ? Number(toEnglishDigits(values.amount)) : '',
      commission: values.commission ? Number(toEnglishDigits(values.commission)) : '',
      customerId: values.customerId ? Number(values.customerId) : '',
      propertyId: values.propertyId ? Number(values.propertyId) : '',
      advisorId: values.advisorId ? Number(values.advisorId) : '',
    }

    const validationErrors = validateContract(payload)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error('لطفاً خطاهای فرم را اصلاح کنید')
      return
    }

    setSubmitting(true)
    const tid = toast.loading(isEdit ? 'در حال به‌روزرسانی…' : 'در حال ثبت…')
    try {
      // تبدیل تاریخ‌های ورودی به ISO کامل
      const startDateIso = values.startDate
        ? new Date(values.startDate + 'T00:00:00').toISOString()
        : null
      const endDateIso = values.endDate
        ? new Date(values.endDate + 'T23:59:59').toISOString()
        : null

      const data = {
        type: payload.type,
        customerId: payload.customerId,
        propertyId: payload.propertyId,
        advisorId: payload.advisorId,
        startDate: startDateIso,
        endDate: endDateIso,
        amount: payload.amount,
        commission: payload.commission,
        status: payload.status,
        note: (payload.note || '').trim(),
      }

      if (isEdit) {
        await contractService.update(contract.id, data)
        toast.success('قرارداد با موفقیت به‌روزرسانی شد', { id: tid })
      } else {
        // تولید کد قرارداد به‌صورت خودکار
        let existingCount = 0
        try {
          const all = await contractService.getAll({ _limit: 1 })
          existingCount = Array.isArray(all) ? all.length : 0
        } catch {
          /* غیربحرانی */
        }
        data.code = generateContractCode(existingCount)
        data.createdAt = new Date().toISOString()
        const created = await contractService.create(data)
        // ثبت فعالیت
        try {
          await reportService.createActivity({
            userId: user?.id,
            action: 'created_contract',
            description: `قرارداد «${data.code}» ثبت شد`,
            entityType: 'contract',
            entityId: created?.id || null,
            createdAt: new Date().toISOString(),
          })
        } catch {
          /* غیربحرانی */
        }
        toast.success('قرارداد جدید با موفقیت ثبت شد', { id: tid })
      }
      onSubmitSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'خطا در ثبت قرارداد', { id: tid })
    } finally {
      setSubmitting(false)
    }
  }

  // کد در حالت ویرایش: نمایش ثابت، در حالت جدید: تولید خودکار
  const codeDisplay = isEdit ? values.code : '— (تولید خودکار) —'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? 'ویرایش قرارداد' : 'افزودن قرارداد جدید'}
      description={isEdit ? values.code : 'اطلاعات قرارداد جدید را وارد کنید'}
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText={isEdit ? 'به‌روزرسانی' : 'ثبت قرارداد'}
          loading={submitting}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* کد + نوع + وضعیت */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="کد قرارداد" value={codeDisplay} disabled hint={isEdit ? 'کد ثابت قرارداد' : 'به‌صورت خودکار تولید می‌شود'} />
          <Select
            label="نوع قرارداد"
            required
            options={CONTRACT_TYPES}
            placeholder="انتخاب نوع…"
            value={values.type}
            onChange={(e) => setField('type', e.target.value)}
            error={errors.type}
          />
          <Select
            label="وضعیت"
            required
            options={CONTRACT_STATUS}
            placeholder="انتخاب وضعیت…"
            value={values.status}
            onChange={(e) => setField('status', e.target.value)}
            error={errors.status}
          />
        </div>

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

        {/* تاریخ شروع + پایان */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="تاریخ شروع"
            type="date"
            required
            value={values.startDate}
            onChange={(e) => setField('startDate', e.target.value)}
            onBlur={() => validateField('startDate')}
            error={errors.startDate}
          />
          <Input
            label="تاریخ پایان"
            type="date"
            required
            value={values.endDate}
            onChange={(e) => setField('endDate', e.target.value)}
            onBlur={() => validateField('endDate')}
            error={errors.endDate}
          />
        </div>

        {/* مبلغ + کمیسیون */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="مبلغ قرارداد (تومان)"
            required
            placeholder="۵٬۰۰۰٬۰۰۰٬۰۰۰"
            value={formatNumberDisplay(values.amount)}
            onChange={(e) => {
              const raw = toEnglishDigits(e.target.value)
              if (raw === '' || /^\d+$/.test(raw)) setField('amount', raw)
            }}
            onBlur={() => validateField('amount')}
            error={errors.amount}
            inputMode="numeric"
            hint="به تومان وارد شود"
            leftIcon={<FileText className="w-4 h-4" />}
          />
          <Input
            label="کمیسیون (تومان)"
            required
            placeholder="۷۵٬۰۰۰٬۰۰۰"
            value={formatNumberDisplay(values.commission)}
            onChange={(e) => {
              const raw = toEnglishDigits(e.target.value)
              if (raw === '' || /^\d+$/.test(raw)) setField('commission', raw)
            }}
            onBlur={() => validateField('commission')}
            error={errors.commission}
            inputMode="numeric"
            hint="به تومان وارد شود"
          />
        </div>

        {/* یادداشت */}
        <Textarea
          label="یادداشت"
          rows={3}
          placeholder="توضیحات اضافی درباره قرارداد…"
          value={values.note}
          onChange={(e) => setField('note', e.target.value)}
        />

        {/* دکمه مخفی برای submit با Enter */}
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Modal>
  )
}
