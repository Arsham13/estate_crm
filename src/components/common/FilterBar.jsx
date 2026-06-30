import React from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

/**
 * FilterBar — نوار فیلترها
 * - title و دکمه reset
 * - children: فیلدهای فیلتر
 */
export default function FilterBar({ children, onReset, hasActiveFilters = false, title = 'فیلترها' }) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-content">
          <SlidersHorizontal className="w-4 h-4 text-gold-600" />
          {title}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="press-effect inline-flex items-center gap-1 text-xs text-content-muted hover:text-error cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            پاک کردن فیلترها
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {children}
      </div>
    </div>
  )
}

// آیتم فیلتر
export function FilterItem({ label, children }) {
  return (
    <div>
      {label && <label className="block mb-1.5 text-xs font-medium text-content-muted">{label}</label>}
      {children}
    </div>
  )
}
