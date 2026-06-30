// StatCard — کارت آمار داشبورد با آیکون، گرادیان رنگی، انیمیشن ورود و افکت فشردن
import ScrollAnimate from '../common/ScrollAnimate.jsx'
import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

// نگاشت رنگ‌ها به کلاس‌های گرادیان tailwind (پشتیبانی از dark mode)
const COLOR_GRADIENTS = {
  gold:    'from-gold-500 to-gold-700',
  emerald: 'from-emerald-500 to-emerald-700',
  rose:    'from-rose-500 to-rose-700',
  sky:     'from-sky-500 to-sky-700',
  purple:  'from-purple-500 to-purple-700',
  amber:   'from-amber-500 to-amber-700',
}

// رنگ متن زیر عنوان (تغییر نسبت)
const CHANGE_UP = 'text-emerald-600 dark:text-emerald-400'
const CHANGE_DOWN = 'text-rose-600 dark:text-rose-400'

/**
 * StatCard — نمایش یک آمار سریع در داشبورد
 * props:
 *  - icon: آیکون lucide
 *  - title: عنوان
 *  - value: مقدار اصلی (رشته آماده برای نمایش)
 *  - change: درصد تغییر (عدد، مثبت/منفی)
 *  - color: کلید رنگ (gold|emerald|rose|sky|purple|amber)
 *  - delay: تأخیر انیمیشن (ms)
 *  - footer: متن کوچک پایین (اختیاری)
 *  - progress: عدد ۰ تا ۱۰۰ برای نمایش نوار پیشرفت (اختیاری)
 *  - progressLabel: برچسب نوار پیشرفت (اختیاری)
 */
export default function StatCard({
  icon: Icon,
  title,
  value,
  change = null,
  color = 'gold',
  delay = 0,
  footer = null,
  progress = null,
  progressLabel = null,
}) {
  const gradient = COLOR_GRADIENTS[color] || COLOR_GRADIENTS.gold
  const isUp = typeof change === 'number' ? change >= 0 : null
  const hasProgress = typeof progress === 'number' && progress >= 0

  return (
    <ScrollAnimate type="fade-up" delay={delay}>
<div
      className="press-effect cursor-pointer bg-surface border border-border rounded-2xl p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden relative group"
    >
      {/* هدر: آیکون + عنوان */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div
          className={`shrink-0 p-3 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg group-hover:scale-105 transition-transform duration-200`}
        >
          {Icon && <Icon className="w-6 h-6" />}
        </div>
        {typeof change === 'number' && (
          <div className={`flex items-center gap-1 text-xs font-bold ${isUp ? CHANGE_UP : CHANGE_DOWN}`}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{Math.abs(change).toLocaleString('fa-IR')}٪</span>
          </div>
        )}
      </div>

      {/* مقدار اصلی */}
      <div className="space-y-1">
        <p className="text-sm text-content-muted truncate">{title}</p>
        <p className="text-2xl font-bold text-content leading-tight">{value}</p>
        {footer && !hasProgress && (
          <p className="text-xs text-content-muted mt-2 truncate">{footer}</p>
        )}
      </div>

      {/* نوار پیشرفت (اختیاری) */}
      {hasProgress && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-content-muted">{progressLabel || 'پیشرفت'}</span>
            <span className="font-semibold text-content">
              {Math.round(progress).toLocaleString('fa-IR')}٪
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-muted overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* دکوراسیون گرادیان محو در گوشه */}
      <div
        className={`absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-15 group-hover:opacity-20 group-hover:scale-105 transition duration-300 blur-xl pointer-events-none`}
      />
    </div>
</ScrollAnimate>
  )
}
