import React from 'react'
import { BADGE_COLORS } from '../../utils/constants.js'

const SIZES = {
  sm: 'text-[11px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1',
  lg: 'text-sm px-3 py-1.5 gap-1.5',
}

/**
 * Badge با رنگ‌های مختلف
 * - color: gold | success | error | warning | info | purple | gray
 * - dot: نمایش نقطه کنار متن
 */
export default function Badge({ children, color = 'gray', size = 'md', dot = false, className = '' }) {
  const colorClass = BADGE_COLORS[color] || BADGE_COLORS.gray
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${SIZES[size] || SIZES.md} ${colorClass} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  )
}
