import React from 'react'
import ScrollAnimate from './ScrollAnimate.jsx'

export default function Card({ children, className = '', padding = 'p-5', hover = false, animate = null, animateDelay = null, ...rest }) {
  const cardContent = (
    <div className={`bg-surface border border-border rounded-2xl shadow-card ${hover ? 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5' : ''} ${padding} ${className}`} {...rest}>
      {children}
    </div>
  )
  if (animate) {
    return <ScrollAnimate type={animate} delay={animateDelay || 0}>{cardContent}</ScrollAnimate>
  }
  return cardContent
}

export function CardHeader({ title, subtitle, action, icon = null }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="shrink-0 p-2.5 rounded-xl bg-gold-50 text-gold-600 dark:bg-gold-900/20 dark:text-gold-400">{icon}</div>
        )}
        <div>
          {title && <h3 className="text-base font-bold text-content">{title}</h3>}
          {subtitle && <p className="text-sm text-content-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
