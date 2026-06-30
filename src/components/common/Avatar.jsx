import React from 'react'
import { getInitials } from '../../utils/formatters.js'

const SIZES = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

// تولید رنگ پس‌زمینه بر اساس نام (هش)
function colorForName(name = '') {
  const colors = [
    'bg-rose-500',
    'bg-pink-500',
    'bg-fuchsia-500',
    'bg-purple-500',
    'bg-violet-500',
    'bg-indigo-500',
    'bg-blue-500',
    'bg-sky-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-emerald-500',
    'bg-green-500',
    'bg-lime-600',
    'bg-amber-500',
    'bg-orange-500',
    'bg-red-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Avatar — نمایش تصویر یا حروف اول نام
 */
export default function Avatar({ src, name = '', size = 'md', className = '', onClick }) {
  const sizeClass = SIZES[size] || SIZES.md
  const handleClick = onClick
  return (
    <div
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden text-white font-medium shrink-0 ${sizeClass} ${handleClick ? 'cursor-pointer press-effect' : ''} ${className}`}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${colorForName(name)}`}>
          {getInitials(name) || '؟'}
        </div>
      )}
    </div>
  )
}
