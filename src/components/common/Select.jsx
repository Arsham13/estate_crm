import React, { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Select با پشتیبانی از label و error
 */
const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    options = [],
    placeholder = 'انتخاب کنید…',
    required = false,
    className = '',
    containerClassName = '',
    ...rest
  },
  ref
) {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block mb-1.5 text-sm font-medium text-content">
          {label}
          {required && <span className="text-error mr-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          required={required}
          className={`w-full h-10 appearance-none rounded-xl border bg-surface px-3.5 pl-10 text-sm text-content transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 ${error ? 'border-error' : 'border-border'} ${className}`}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
      </div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-content-muted">{hint}</p>}
    </div>
  )
})

export default Select
