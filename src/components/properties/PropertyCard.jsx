// PropertyCard — کارت نمایش ملک در نمای گرید با هاور افکت، نشان وضعیت و اطلاعات کلیدی
import ScrollAnimate from '../common/ScrollAnimate.jsx'
import React from 'react'
import {
  Building2,
  MapPin,
  Maximize,
  BedDouble,
  Layers,
  Calendar,
  Eye,
  Car,
  Warehouse,
  ArrowUpCircle,
} from 'lucide-react'
import Badge from '../common/Badge.jsx'
import {
  PROPERTY_TYPES,
  DEAL_TYPES,
  PROPERTY_STATUS,
} from '../../utils/constants.js'
import { getLabel } from '../../utils/helpers.js'
import { formatCompactCurrency, truncate } from '../../utils/formatters.js'

const fa = (n) => Number(n || 0).toLocaleString('fa-IR')

// گرادیان پس‌زمینه بر اساس نوع ملک
const TYPE_GRADIENTS = {
  apartment: 'from-sky-500 via-blue-500 to-indigo-600',
  villa: 'from-emerald-500 via-teal-500 to-cyan-600',
  shop: 'from-amber-500 via-orange-500 to-rose-500',
  land: 'from-lime-500 via-green-500 to-emerald-600',
}

// رنگ نشان وضعیت
const STATUS_COLOR = {
  available: 'success',
  sold: 'error',
  rented: 'info',
}

/**
 * PropertyCard
 * props:
 *  - property: object
 *  - onClick?: (property) => void  (باز کردن جزئیات)
 *  - delay?: number (ms) برای انیمیشن staggered
 */
export default function PropertyCard({ property, onClick, delay = 0 }) {
  if (!property) return null

  const gradient =
    TYPE_GRADIENTS[property.type] || 'from-gold-500 via-amber-500 to-orange-600'

  const features = [
    property.hasParking && { icon: Car, label: 'پارکینگ' },
    property.hasStorage && { icon: Warehouse, label: 'انباری' },
    property.hasElevator && { icon: ArrowUpCircle, label: 'آسانسور' },
  ].filter(Boolean)

  return (
    <ScrollAnimate type="fade-up" delay={delay}>
<div
      onClick={() => onClick?.(property)}
      className="press-effect cursor-pointer group bg-surface border border-border rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 flex flex-col"
    >
      {/* هدر گرادیان با آیکون ملک */}
      <div className={`relative h-32 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        <Building2 className="w-16 h-16 text-white/90 group-hover:scale-110 transition-transform duration-300" />
        {/* کد ملک در گوشه */}
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/30 backdrop-blur-sm text-white text-[11px] font-mono font-semibold">
          {property.code || '—'}
        </span>
        {/* وضعیت در گوشه پایین */}
        <span className="absolute bottom-2 left-2">
          <Badge color={STATUS_COLOR[property.status] || 'gray'} size="sm">
            {getLabel(PROPERTY_STATUS, property.status)}
          </Badge>
        </span>
        {/* تعداد بازدید در گوشه پایین راست */}
        {typeof property.viewCount === 'number' && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/30 backdrop-blur-sm text-white text-[11px]">
            <Eye className="w-3 h-3" />
            {fa(property.viewCount)}
          </span>
        )}
      </div>

      {/* بدنه کارت */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        {/* بج‌های نوع و نوع معامله */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge color="gold" size="sm">
            {getLabel(PROPERTY_TYPES, property.type)}
          </Badge>
          <Badge color="purple" size="sm">
            {getLabel(DEAL_TYPES, property.dealType)}
          </Badge>
        </div>

        {/* آدرس */}
        <div className="flex items-start gap-1.5 text-sm text-content min-h-[2.5rem]">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-content-muted" />
          <p className="leading-6 line-clamp-2" title={property.address}>
            {truncate(property.address, 60)}
          </p>
        </div>

        {/* مشخصات فنی */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1 text-content-muted">
            <Maximize className="w-3.5 h-3.5 text-gold-600" />
            <span>{property.area ? `${fa(property.area)} م²` : '—'}</span>
          </div>
          <div className="flex items-center gap-1 text-content-muted">
            <BedDouble className="w-3.5 h-3.5 text-gold-600" />
            <span>{property.rooms != null ? fa(property.rooms) : '—'}</span>
          </div>
          <div className="flex items-center gap-1 text-content-muted">
            <Layers className="w-3.5 h-3.5 text-gold-600" />
            <span>{property.floor != null ? `ط${fa(property.floor)}` : '—'}</span>
          </div>
        </div>

        {/* امکانات */}
        {features.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {features.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 text-[11px] text-content-muted"
              >
                <f.icon className="w-3 h-3" />
                {f.label}
              </span>
            ))}
          </div>
        )}

        {/* سال ساخت (اگر وجود داشت) */}
        {property.yearBuilt && (
          <div className="flex items-center gap-1 text-[11px] text-content-muted">
            <Calendar className="w-3 h-3" />
            ساخت {fa(property.yearBuilt)}
          </div>
        )}

        {/* قیمت */}
        <div className="mt-auto pt-2 border-t border-border">
          <p className="text-xs text-content-muted">قیمت</p>
          <p className="text-base font-bold text-gold-700 dark:text-gold-400">
            {property.price ? `${formatCompactCurrency(property.price)} ت` : '—'}
          </p>
        </div>
      </div>
    </div>
</ScrollAnimate>
  )
}
