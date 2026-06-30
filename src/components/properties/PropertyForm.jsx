// PropertyForm — مودال فرم افزودن/ویرایش ملک با اعتبارسنجی و تولید خودکار کد ملک
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Building2, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal, { ModalFooter } from '../common/Modal.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import Textarea from '../common/Textarea.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { propertyService } from '../../services/propertyService.js'
import { authService } from '../../services/authService.js'
import { reportService } from '../../services/reportService.js'
import { validateProperty, validators } from '../../utils/validators.js'
import {
  PROPERTY_TYPES,
  DEAL_TYPES,
  PROPERTY_STATUS,
} from '../../utils/constants.js'
import {
  generatePropertyCode,
} from '../../utils/formatters.js'

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

const EMPTY = {
  code: '',
  type: '',
  address: '',
  area: '',
  rooms: '',
  price: '',
  dealType: '',
  status: '',
  floor: '',
  yearBuilt: '',
  hasParking: false,
  hasStorage: false,
  hasElevator: false,
  description: '',
  assignedTo: '',
}

/**
 * PropertyForm
 * props:
 *  - open
 *  - onClose
 *  - property: object | null
 *  - onSubmitSuccess: () => void
 */
export default function PropertyForm({ open, onClose, property = null, onSubmitSuccess }) {
  const { user, hasRole } = useAuth()
  const isAdmin = hasRole(['admin'])

  const [advisors, setAdvisors] = useState([])
  const [loadingAdvisors, setLoadingAdvisors] = useState(false)

  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const isEdit = Boolean(property && property.id)

  // واکشی مشاوران
  useEffect(() => {
    if (!open || !isAdmin) return
    let active = true
    setLoadingAdvisors(true)
    authService
      .getAll()
      .then((users) => {
        if (!active) return
        setAdvisors((users || []).filter((u) => u.role === 'advisor' && u.isActive))
      })
      .catch(() => active && setAdvisors([]))
      .finally(() => active && setLoadingAdvisors(false))
    return () => {
      active = false
    }
  }, [open, isAdmin])

  // مقداردهی اولیه فرم
  useEffect(() => {
    if (!open) return
    if (property && property.id) {
      setValues({
        code: property.code || '',
        type: property.type || '',
        address: property.address || '',
        area: property.area != null ? String(property.area) : '',
        rooms: property.rooms != null ? String(property.rooms) : '',
        price: property.price != null ? String(property.price) : '',
        dealType: property.dealType || '',
        status: property.status || '',
        floor: property.floor != null ? String(property.floor) : '',
        yearBuilt: property.yearBuilt != null ? String(property.yearBuilt) : '',
        hasParking: !!property.hasParking,
        hasStorage: !!property.hasStorage,
        hasElevator: !!property.hasElevator,
        description: property.description || '',
        assignedTo: property.assignedTo != null ? String(property.assignedTo) : '',
      })
    } else {
      setValues({
        ...EMPTY,
        assignedTo: isAdmin ? '' : String(user?.id || ''),
      })
    }
    setErrors({})
  }, [open, property, isAdmin, user])

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
    if (field === 'address') err = validators.required(values.address)
    else if (field === 'area') err = validators.positiveNumber(values.area)
    else if (field === 'price') err = validators.positiveNumber(values.price)
    else if (field === 'rooms') err = validators.optionalNumber(values.rooms)
    else if (field === 'floor') err = validators.optionalNumber(values.floor)
    else if (field === 'yearBuilt') err = validators.optionalNumber(values.yearBuilt)
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
      area: values.area ? Number(toEnglishDigits(values.area)) : '',
      rooms: values.rooms ? Number(toEnglishDigits(values.rooms)) : '',
      price: values.price ? Number(toEnglishDigits(values.price)) : '',
      floor: values.floor ? Number(toEnglishDigits(values.floor)) : '',
      yearBuilt: values.yearBuilt ? Number(toEnglishDigits(values.yearBuilt)) : '',
      assignedTo: values.assignedTo ? Number(values.assignedTo) : '',
    }

    const validationErrors = validateProperty(payload)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error('لطفاً خطاهای فرم را اصلاح کنید')
      return
    }

    setSubmitting(true)
    const tid = toast.loading(isEdit ? 'در حال به‌روزرسانی…' : 'در حال ثبت…')
    try {
      const data = {
        type: payload.type,
        address: payload.address.trim(),
        area: payload.area,
        rooms: payload.rooms || null,
        price: payload.price,
        dealType: payload.dealType,
        status: payload.status,
        floor: payload.floor || null,
        yearBuilt: payload.yearBuilt || null,
        hasParking: !!payload.hasParking,
        hasStorage: !!payload.hasStorage,
        hasElevator: !!payload.hasElevator,
        description: payload.description?.trim() || '',
        assignedTo: payload.assignedTo,
      }

      if (isEdit) {
        await propertyService.update(property.id, data)
        toast.success('ملک با موفقیت به‌روزرسانی شد', { id: tid })
      } else {
        // تولید کد ملک
        let existingCount = 0
        try {
          const all = await propertyService.getAll({ _limit: 1 })
          existingCount = Array.isArray(all) ? all.length : 0
        } catch {
          /* غیربحرانی */
        }
        data.code = generatePropertyCode(existingCount)
        data.viewCount = 0
        data.images = []
        data.createdAt = new Date().toISOString()
        const created = await propertyService.create(data)
        // ثبت فعالیت
        try {
          await reportService.createActivity({
            userId: user?.id,
            action: 'created_property',
            description: `ملک «${data.code}» اضافه شد`,
            entityType: 'property',
            entityId: created?.id || null,
            createdAt: new Date().toISOString(),
          })
        } catch {
          /* غیربحرانی */
        }
        toast.success('ملک جدید با موفقیت ثبت شد', { id: tid })
      }
      onSubmitSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'خطا در ثبت ملک', { id: tid })
    } finally {
      setSubmitting(false)
    }
  }

  // گزینه‌های کد در حالت ویرایش: فقط نمایش
  const codeDisplay = isEdit ? values.code : '— (تولید خودکار) —'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? 'ویرایش ملک' : 'افزودن ملک جدید'}
      description={isEdit ? values.code : 'اطلاعات ملک جدید را وارد کنید'}
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText={isEdit ? 'به‌روزرسانی' : 'ثبت ملک'}
          loading={submitting}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* کد ملک + نوع */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="کد ملک"
            value={codeDisplay}
            disabled
            hint={isEdit ? 'کد ثابت ملک' : 'به‌صورت خودکار تولید می‌شود'}
          />
          <Select
            label="نوع ملک"
            required
            options={PROPERTY_TYPES}
            placeholder="انتخاب نوع…"
            value={values.type}
            onChange={(e) => setField('type', e.target.value)}
            error={errors.type}
          />
        </div>

        {/* آدرس */}
        <Textarea
          label="آدرس کامل"
          required
          rows={2}
          placeholder="استان، شهر، محله، خیابان، پلاک…"
          value={values.address}
          onChange={(e) => setField('address', e.target.value)}
          onBlur={() => validateField('address')}
          error={errors.address}
        />

        {/* مساحت، اتاق، طبقه، سال ساخت */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Input
            label="متراژ (م²)"
            required
            placeholder="۱۲۰"
            value={formatNumberDisplay(values.area)}
            onChange={(e) => {
              const raw = toEnglishDigits(e.target.value)
              if (raw === '' || /^\d+$/.test(raw)) setField('area', raw)
            }}
            onBlur={() => validateField('area')}
            error={errors.area}
            inputMode="numeric"
            leftIcon={<MapPin className="w-4 h-4" />}
          />
          <Input
            label="تعداد اتاق"
            placeholder="۳"
            value={formatNumberDisplay(values.rooms)}
            onChange={(e) => {
              const raw = toEnglishDigits(e.target.value)
              if (raw === '' || /^\d+$/.test(raw)) setField('rooms', raw)
            }}
            onBlur={() => validateField('rooms')}
            error={errors.rooms}
            inputMode="numeric"
          />
          <Input
            label="طبقه"
            placeholder="۴"
            value={formatNumberDisplay(values.floor)}
            onChange={(e) => {
              const raw = toEnglishDigits(e.target.value)
              if (raw === '' || /^-?\d+$/.test(raw)) setField('floor', raw)
            }}
            onBlur={() => validateField('floor')}
            error={errors.floor}
            inputMode="numeric"
          />
          <Input
            label="سال ساخت"
            placeholder="۱۳۹۸"
            value={formatNumberDisplay(values.yearBuilt)}
            onChange={(e) => {
              const raw = toEnglishDigits(e.target.value)
              if (raw === '' || /^\d+$/.test(raw)) setField('yearBuilt', raw)
            }}
            onBlur={() => validateField('yearBuilt')}
            error={errors.yearBuilt}
            inputMode="numeric"
          />
        </div>

        {/* قیمت، نوع معامله، وضعیت */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="قیمت (تومان)"
            required
            placeholder="۵٬۰۰۰٬۰۰۰٬۰۰۰"
            value={formatNumberDisplay(values.price)}
            onChange={(e) => {
              const raw = toEnglishDigits(e.target.value)
              if (raw === '' || /^\d+$/.test(raw)) setField('price', raw)
            }}
            onBlur={() => validateField('price')}
            error={errors.price}
            inputMode="numeric"
            hint="به تومان وارد شود"
          />
          <Select
            label="نوع معامله"
            required
            options={DEAL_TYPES}
            placeholder="انتخاب…"
            value={values.dealType}
            onChange={(e) => setField('dealType', e.target.value)}
            error={errors.dealType}
          />
          <Select
            label="وضعیت ملک"
            required
            options={PROPERTY_STATUS}
            placeholder="انتخاب…"
            value={values.status}
            onChange={(e) => setField('status', e.target.value)}
            error={errors.status}
          />
        </div>

        {/* امکانات */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CheckboxField
            label="پارکینگ"
            checked={values.hasParking}
            onChange={(v) => setField('hasParking', v)}
          />
          <CheckboxField
            label="انباری"
            checked={values.hasStorage}
            onChange={(v) => setField('hasStorage', v)}
          />
          <CheckboxField
            label="آسانسور"
            checked={values.hasElevator}
            onChange={(v) => setField('hasElevator', v)}
          />
        </div>

        {/* مشاور مسئول */}
        <div className="grid grid-cols-1 gap-4">
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

        {/* توضیحات */}
        <Textarea
          label="توضیحات"
          rows={3}
          placeholder="توضیحات اضافی درباره ملک…"
          value={values.description}
          onChange={(e) => setField('description', e.target.value)}
        />

        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Modal>
  )
}

// فیلد چک‌باکس ساده با استایل
function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="press-effect flex items-center gap-3 p-3 rounded-xl border border-border bg-surface cursor-pointer hover:bg-surface-muted/40 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded accent-gold-600 cursor-pointer"
      />
      <span className="text-sm font-medium text-content select-none">{label}</span>
    </label>
  )
}
