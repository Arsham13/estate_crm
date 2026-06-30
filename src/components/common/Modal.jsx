import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import Button from './Button.jsx'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
}

/**
 * Modal با پشتیبانی از:
 * - پورتال (render در body)
 * - بستن با Esc و کلیک روی backdrop
 * - انیمیشن ورود
 * - full-screen در موبایل
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  showClose = true,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Dialog'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Modal content */}
      <div
        className={`relative w-full ${SIZES[size] || SIZES.md} max-h-[92vh] bg-surface rounded-2xl shadow-2xl flex flex-col animate-scale-in ${
          // full-screen در موبایل
          'sm:rounded-2xl'
        }`}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
            <div className="flex-1">
              {title && <h2 className="text-lg font-bold text-content">{title}</h2>}
              {description && <p className="mt-1 text-sm text-content-muted">{description}</p>}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="press-effect shrink-0 p-1.5 rounded-lg text-content-muted hover:text-content hover:bg-surface-muted cursor-pointer transition-colors"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 p-5 border-t border-border bg-surface-muted/30 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// هدر استاندارد برای دکمه‌های فرم
export function ModalFooter({ onCancel, onSubmit, submitText = 'ذخیره', cancelText = 'انصراف', loading = false, submitDisabled = false }) {
  return (
    <>
      <Button variant="secondary" onClick={onCancel} type="button">
        {cancelText}
      </Button>
      <Button onClick={onSubmit} loading={loading} disabled={submitDisabled} type="submit">
        {submitText}
      </Button>
    </>
  )
}
