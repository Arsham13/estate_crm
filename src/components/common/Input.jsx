import React, { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const SIZES = {
  sm: 'h-9 text-sm',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
}

/**
 * Input با پشتیبانی از:
 * - label و error message
 * - آیکون سمت راست/چپ
 * - toggle نمایش رمز عبور (type=password)
 * - cursor-pointer روی آیکون‌ها
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    size = 'md',
    leftIcon = null,
    rightIcon = null,
    className = '',
    containerClassName = '',
    type = 'text',
    required = false,
    showPasswordToggle = false,
    ...rest
  },
  ref
) {
  const [show, setShow] = useState(false)
  const inputType = showPasswordToggle ? (show ? 'text' : 'password') : type

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block mb-1.5 text-sm font-medium text-content">
          {label}
          {required && <span className="text-error mr-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-content-muted">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          required={required}
          className={`w-full ${SIZES[size] || SIZES.md} rounded-xl border bg-surface px-3.5 text-content placeholder:text-content-muted/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 ${leftIcon ? 'pr-10' : ''} ${rightIcon || showPasswordToggle ? 'pl-10' : ''} ${error ? 'border-error focus:border-error focus:ring-error/20' : 'border-border'} ${className}`}
          {...rest}
        />
        {showPasswordToggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 left-0 flex items-center pl-3 text-content-muted hover:text-content cursor-pointer transition-colors"
            aria-label={show ? 'مخفی کردن رمز' : 'نمایش رمز'}
          >
            {show ? <EyeOff className="w-4 h-4 press-effect" /> : <Eye className="w-4 h-4 press-effect" />}
          </button>
        )}
        {!showPasswordToggle && rightIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-content-muted">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-content-muted">{hint}</p>}
    </div>
  )
})

export default Input
