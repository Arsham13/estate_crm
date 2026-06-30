import React from 'react'
import { Search, X } from 'lucide-react'

/**
 * SearchBar با آیکون و دکمه پاک کردن
 * - پشتیبانی از debounce با onChange
 */
export default function SearchBar({ value, onChange, placeholder = 'جستجو…', className = '', autoFocus = false }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full h-10 rounded-xl border border-border bg-surface pr-9 pl-9 text-sm text-content placeholder:text-content-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="press-effect absolute left-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content cursor-pointer"
          aria-label="پاک کردن"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
