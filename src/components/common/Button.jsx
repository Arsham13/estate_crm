import React from 'react'
import { Loader2 } from 'lucide-react'

// سایزهای مجاز
const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

// واریانت‌های ظاهری
const VARIANTS = {
  primary: 'bg-gold-600 hover:bg-gold-700 text-white shadow-sm',
  secondary: 'bg-surface border border-border hover:bg-surface-muted text-content',
  ghost: 'hover:bg-surface-muted text-content',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm',
  outline: 'border border-gold-600 text-gold-700 hover:bg-gold-50 dark:text-gold-400 dark:hover:bg-gold-900/20',
}

/**
 * دکمه با پشتیبانی از:
 * - variant و size
 * - افکت active (فشردن موس): scale-95
 * - cursor-pointer روی همه حالت‌ها
 * - loading state
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  type = 'button',
  ...rest
}) {
  const isDisabled = disabled || loading
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`press-effect inline-flex items-center justify-center rounded-xl font-medium cursor-pointer transition-colors duration-200 select-none disabled:cursor-not-allowed ${SIZES[size] || SIZES.md} ${VARIANTS[variant] || VARIANTS.primary} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}
