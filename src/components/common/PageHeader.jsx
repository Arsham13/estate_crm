import React from 'react'
import ScrollAnimate from './ScrollAnimate.jsx'

export default function PageHeader({ title, description, actions, icon: Icon = null, animate = true }) {
  const content = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="shrink-0 p-2.5 rounded-xl bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-content">{title}</h1>
          {description && <p className="text-sm text-content-muted mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
  return animate ? <ScrollAnimate type="fade-down">{content}</ScrollAnimate> : content
}
