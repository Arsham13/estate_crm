import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'

/**
 * ConfirmDialog — مودال تأیید عملیات (مثل حذف)
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'تأیید عملیات',
  message = 'آیا از انجام این عملیات مطمئن هستید؟',
  confirmText = 'تأیید',
  cancelText = 'انصراف',
  danger = true,
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className={`mb-4 p-3 rounded-2xl ${danger ? 'bg-red-100 text-error dark:bg-red-900/30' : 'bg-gold-100 text-gold-700 dark:bg-gold-900/30'}`}>
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-content mb-2">{title}</h3>
        <p className="text-sm text-content-muted mb-6 max-w-sm">{message}</p>
        <div className="flex items-center gap-2 w-full">
          <Button variant="secondary" onClick={onClose} fullWidth>
            {cancelText}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} fullWidth>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
