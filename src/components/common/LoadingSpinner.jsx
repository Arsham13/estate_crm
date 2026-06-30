import React from 'react'
import { Loader2 } from 'lucide-react'

const SIZES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

/**
 * LoadingSpinner — اسپینر بارگذاری
 */
export default function LoadingSpinner({ size = 'md', label = '', className = '', fullPage = false }) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${SIZES[size] || SIZES.md} animate-spin text-gold-600`} />
      {label && <p className="text-sm text-content-muted">{label}</p>}
    </div>
  )
  if (fullPage) {
    return <div className="flex items-center justify-center min-h-[60vh]">{content}</div>
  }
  return content
}

// Skeleton برای جدول‌ها و کارت‌ها
export function Skeleton({ className = '', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`relative overflow-hidden bg-surface-muted rounded-lg ${className}`}
        >
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      ))}
    </>
  )
}
