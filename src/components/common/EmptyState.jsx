import React from 'react'

/**
 * EmptyState — حالت خالی لیست‌ها
 */
export default function EmptyState({
  icon: Icon = null,
  title = 'داده‌ای یافت نشد',
  description = '',
  action = null,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {Icon && (
        <div className="mb-4 p-4 rounded-2xl bg-surface-muted text-content-muted">
          <Icon className="w-10 h-10" />
        </div>
      )}
      <h3 className="text-base font-semibold text-content mb-1">{title}</h3>
      {description && <p className="text-sm text-content-muted max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
