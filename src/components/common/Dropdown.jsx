import React, { useState, useRef, useEffect } from 'react'

/**
 * Dropdown ساده با کلیک خارج برای بستن
 * Props:
 *   trigger: ReactNode (دکمه یا آیکون)
 *   children: function ({ close }) => ReactNode  OR  ReactNode
 *   align: 'left' | 'right' | 'center'
 *   width: عرض محتوا (پیش‌فرض: w-56)
 */
export default function Dropdown({ trigger, children, align = 'left', width = 'w-56', className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const alignClass = align === 'right' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <div onClick={() => setOpen((o) => !o)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={`absolute z-40 mt-2 ${alignClass} ${width} bg-surface border border-border rounded-xl shadow-card-hover py-1.5 animate-scale-in origin-top`}
        >
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({ children, onClick, icon = null, danger = false, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`press-effect w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-right transition-colors cursor-pointer disabled:cursor-not-allowed ${
        danger
          ? 'text-error hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-content hover:bg-surface-muted'
      }`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1 text-right">{children}</span>
    </button>
  )
}
