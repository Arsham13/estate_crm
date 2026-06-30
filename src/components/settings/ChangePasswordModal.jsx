// ChangePasswordModal — مودال تغییر رمز عبور کاربر با فیلدهای رمز جدید و تأیید رمز
import React, { useState, useEffect } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal, { ModalFooter } from '../common/Modal.jsx'
import Input from '../common/Input.jsx'
import { authService } from '../../services/authService.js'
import { reportService } from '../../services/reportService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { validators } from '../../utils/validators.js'

/**
 * ChangePasswordModal
 * props:
 *  - open: boolean
 *  - onClose: () => void
 *  - user: object | null (کاربری که رمز او تغییر می‌کند)
 *  - onSuccess: () => void
 */
export default function ChangePasswordModal({ open, onClose, user = null, onSuccess }) {
  const { user: currentUser } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // reset هنگام بسته شدن
  useEffect(() => {
    if (!open) {
      setPassword('')
      setConfirm('')
      setErrors({})
      setSubmitting(false)
    }
  }, [open])

  const validate = () => {
    const errs = {}
    if (!password) errs.password = 'رمز عبور جدید اجباری است'
    else if (password.length < 6) errs.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد'
    if (!confirm) errs.confirm = 'تکرار رمز اجباری است'
    else if (confirm !== password) errs.confirm = 'رمزها مطابقت ندارند'
    return errs
  }

  const validateField = (field) => {
    let err = ''
    if (field === 'password') {
      if (!password) err = 'رمز عبور جدید اجباری است'
      else if (password.length < 6) err = 'رمز عبور باید حداقل ۶ کاراکتر باشد'
    } else if (field === 'confirm') {
      const confirmErr = validators.matchPassword(password)(confirm)
      if (confirmErr) err = confirmErr
    }
    setErrors((prev) => {
      const next = { ...prev }
      if (err) next[field] = err
      else delete next[field]
      return next
    })
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      toast.error('لطفاً خطاهای فرم را اصلاح کنید')
      return
    }
    if (!user?.id) return

    setSubmitting(true)
    const tid = toast.loading('در حال تغییر رمز عبور…')
    try {
      await authService.updatePassword(user.id, password)
      toast.success('رمز عبور با موفقیت تغییر کرد', { id: tid })
      // ثبت فعالیت
      try {
        await reportService.createActivity({
          userId: currentUser?.id,
          action: 'changed_password',
          targetType: 'user',
          targetId: user.id,
          description: `رمز عبور کاربر «${user.name}» تغییر کرد`,
          createdAt: new Date().toISOString(),
        })
      } catch {
        /* غیربحرانی */
      }
      onSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'خطا در تغییر رمز عبور', { id: tid })
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="تغییر رمز عبور"
      description={`تغییر رمز عبور برای کاربر «${user.name || ''}»`}
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText="تغییر رمز"
          loading={submitting}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* نمایش کاربر */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-900/40">
          <div className="shrink-0 p-2 rounded-lg bg-gold-100 dark:bg-gold-900/40 text-gold-700 dark:text-gold-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-content truncate">{user.name}</p>
            <p className="text-xs text-content-muted truncate" dir="ltr">{user.email}</p>
          </div>
        </div>

        <Input
          label="رمز عبور جدید"
          placeholder="حداقل ۶ کاراکتر"
          type="password"
          showPasswordToggle
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => validateField('password')}
          error={errors.password}
          hint="حداقل ۶ کاراکتر"
          leftIcon={<KeyRound className="w-4 h-4" />}
        />

        <Input
          label="تکرار رمز عبور جدید"
          placeholder="رمز عبور را دوباره وارد کنید"
          type="password"
          showPasswordToggle
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => validateField('confirm')}
          error={errors.confirm}
          leftIcon={<KeyRound className="w-4 h-4" />}
        />

        {/* دکمه مخفی برای submit با Enter */}
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Modal>
  )
}
