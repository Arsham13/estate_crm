import React, { forwardRef } from 'react'

const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    hint,
    rows = 3,
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
      <textarea
        ref={ref}
        rows={rows}
        required={required}
        className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-content placeholder:text-content-muted/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 resize-y ${error ? 'border-error' : 'border-border'} ${className}`}
        {...rest}
      />
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-content-muted">{hint}</p>}
    </div>
  )
})

export default Textarea
