// Settings — صفحه تنظیمات ادمین با دو بخش: مدیریت کاربران و لاگ فعالیت‌ها
import ScrollAnimate from '../components/common/ScrollAnimate.jsx'
import React, { useState, useEffect, useMemo } from 'react'
import {
  Settings as SettingsIcon,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Power,
  Activity as ActivityIcon,
  AlertCircle,
  Inbox,
  Users as UsersIcon,
  UserCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { useApi } from '../hooks/useApi.js'
import { authService } from '../services/authService.js'
import { reportService } from '../services/reportService.js'
import PageHeader from '../components/common/PageHeader.jsx'
import Button from '../components/common/Button.jsx'
import Table from '../components/common/Table.jsx'
import Badge from '../components/common/Badge.jsx'
import Avatar from '../components/common/Avatar.jsx'
import Pagination from '../components/common/Pagination.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { Skeleton } from '../components/common/LoadingSpinner.jsx'
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'
import FilterBar, { FilterItem } from '../components/common/FilterBar.jsx'
import Select from '../components/common/Select.jsx'
import SearchBar from '../components/common/SearchBar.jsx'
import UserForm from '../components/settings/UserForm.jsx'
import ChangePasswordModal from '../components/settings/ChangePasswordModal.jsx'
import { ROLE_LABELS } from '../utils/constants.js'
import { toJalali, toJalaliDateTime } from '../utils/formatters.js'

const PAGE_SIZE = 10
const fa = (n) => Number(n || 0).toLocaleString('fa-IR')

// رنگ بج برای نقش کاربری
const ROLE_COLOR = {
  admin: 'gold',
  advisor: 'info',
  assistant: 'purple',
}

// لیبل و رنگ اکشن برای لاگ فعالیت‌ها
const ACTION_META = {
  created_customer:   { label: 'افزودن مشتری',         color: 'success' },
  updated_customer:   { label: 'ویرایش مشتری',         color: 'info' },
  created_property:   { label: 'افزودن ملک',           color: 'gold' },
  updated_property:   { label: 'ویرایش ملک',           color: 'info' },
  closed_contract:    { label: 'بستن قرارداد',         color: 'purple' },
  completed_task:     { label: 'انجام وظیفه',          color: 'success' },
  scheduled_visit:    { label: 'برنامه‌ریزی بازدید',    color: 'warning' },
  created_visit:      { label: 'افزودن بازدید',        color: 'warning' },
  created_user:       { label: 'افزودن کاربر',         color: 'success' },
  updated_user:       { label: 'ویرایش کاربر',         color: 'info' },
  changed_password:   { label: 'تغییر رمز عبور',       color: 'warning' },
  updated_pipeline:   { label: 'تغییر مرحله پایپ‌لاین', color: 'purple' },
}

// گزینه‌های فیلتر اکشن (بر اساس داده‌های موجود در db.json)
const ACTION_OPTIONS = [
  { value: 'created_customer',   label: 'افزودن مشتری' },
  { value: 'updated_customer',   label: 'ویرایش مشتری' },
  { value: 'created_property',   label: 'افزودن ملک' },
  { value: 'updated_property',   label: 'ویرایش ملک' },
  { value: 'closed_contract',    label: 'بستن قرارداد' },
  { value: 'completed_task',     label: 'انجام وظیفه' },
  { value: 'scheduled_visit',    label: 'برنامه‌ریزی بازدید' },
  { value: 'created_visit',      label: 'افزودن بازدید' },
  { value: 'created_user',       label: 'افزودن کاربر' },
  { value: 'updated_user',       label: 'ویرایش کاربر' },
  { value: 'changed_password',   label: 'تغییر رمز عبور' },
  { value: 'updated_pipeline',   label: 'تغییر مرحله پایپ‌لاین' },
]

export default function Settings() {
  const { user: currentUser } = useAuth()

  // ======== بخش کاربران ========
  const {
    data: usersRaw,
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useApi(() => authService.getAll(), [])

  const [userSearch, setUserSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [userPage, setUserPage] = useState(1)

  // state مودال‌های کاربر
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [passwordTarget, setPasswordTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  // فیلتر + جستجوی کاربران
  const filteredUsers = useMemo(() => {
    if (!usersRaw) return []
    let list = usersRaw
    const q = userSearch.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q))
      )
    }
    if (filterRole) list = list.filter((u) => u.role === filterRole)
    return list
  }, [usersRaw, userSearch, filterRole])

  // pagination کاربران
  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const safeUserPage = Math.min(userPage, userTotalPages)
  const pagedUsers = useMemo(() => {
    const start = (safeUserPage - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [filteredUsers, safeUserPage])

  useEffect(() => {
    setUserPage(1)
  }, [userSearch, filterRole])

  const hasUserFilters = !!userSearch || !!filterRole

  const handleResetUserFilters = () => {
    setUserSearch('')
    setFilterRole('')
  }

  const handleAddUser = () => {
    setEditingUser(null)
    setFormOpen(true)
  }

  const handleEditUser = (u) => {
    setEditingUser(u)
    setFormOpen(true)
  }

  const handleToggleActive = async (u) => {
    setTogglingId(u.id)
    const tid = toast.loading(u.isActive ? 'در حال غیرفعال‌سازی…' : 'در حال فعال‌سازی…')
    try {
      await authService.update(u.id, { isActive: !u.isActive })
      toast.success(u.isActive ? 'کاربر غیرفعال شد' : 'کاربر فعال شد', { id: tid })
      // ثبت فعالیت
      try {
        await reportService.createActivity({
          userId: currentUser?.id,
          action: 'updated_user',
          targetType: 'user',
          targetId: u.id,
          description: `کاربر «${u.name}» ${u.isActive ? 'غیرفعال' : 'فعال'} شد`,
          createdAt: new Date().toISOString(),
        })
      } catch {
        /* غیربحرانی */
      }
      refetchUsers()
    } catch (err) {
      toast.error(err.message || 'خطا در تغییر وضعیت', { id: tid })
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const tid = toast.loading('در حال حذف…')
    try {
      await authService.remove(deleteTarget.id)
      toast.success('کاربر حذف شد', { id: tid })
      try {
        await reportService.createActivity({
          userId: currentUser?.id,
          action: 'updated_user',
          targetType: 'user',
          targetId: deleteTarget.id,
          description: `کاربر «${deleteTarget.name}» حذف شد`,
          createdAt: new Date().toISOString(),
        })
      } catch {
        /* غیربحرانی */
      }
      setDeleteTarget(null)
      refetchUsers()
    } catch (err) {
      toast.error(err.message || 'خطا در حذف کاربر', { id: tid })
    } finally {
      setDeleting(false)
    }
  }

  // ستون‌های جدول کاربران
  const userColumns = useMemo(
    () => [
      {
        key: 'name',
        header: 'نام کاربر',
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <Avatar name={row.name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-content truncate">
                {row.name}
                {row.id === currentUser?.id && (
                  <span className="mr-2 text-[10px] text-gold-700 dark:text-gold-400 font-bold">
                    (شما)
                  </span>
                )}
              </p>
              <p className="text-xs text-content-muted truncate" dir="ltr">
                {row.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'phone',
        header: 'موبایل',
        render: (row) => (
          <span dir="ltr" className="text-content-muted text-sm">
            {row.phone || '—'}
          </span>
        ),
      },
      {
        key: 'role',
        header: 'نقش',
        render: (row) => (
          <Badge color={ROLE_COLOR[row.role] || 'gray'} dot>
            {ROLE_LABELS[row.role] || row.role}
          </Badge>
        ),
      },
      {
        key: 'isActive',
        header: 'وضعیت',
        render: (row) =>
          row.isActive ? (
            <Badge color="success" dot>
              فعال
            </Badge>
          ) : (
            <Badge color="error" dot>
              غیرفعال
            </Badge>
          ),
      },
      {
        key: 'createdAt',
        header: 'تاریخ ثبت',
        render: (row) => (
          <span className="text-content-muted text-xs">{toJalali(row.createdAt)}</span>
        ),
      },
      {
        key: 'actions',
        header: 'عملیات',
        sortable: false,
        className: 'text-left',
        render: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => handleEditUser(row)}
              className="press-effect p-1.5 rounded-lg text-content-muted hover:text-gold-700 hover:bg-gold-50 dark:hover:bg-gold-900/20 cursor-pointer transition-colors"
              title="ویرایش"
              aria-label="ویرایش"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleActive(row)}
              disabled={togglingId === row.id || row.id === currentUser?.id}
              className="press-effect p-1.5 rounded-lg text-content-muted hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              title={row.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
              aria-label={row.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
            >
              {row.isActive ? <Power className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setPasswordTarget(row)}
              className="press-effect p-1.5 rounded-lg text-content-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
              title="تغییر رمز عبور"
              aria-label="تغییر رمز عبور"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              disabled={row.id === currentUser?.id}
              className="press-effect p-1.5 rounded-lg text-content-muted hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              title={row.id === currentUser?.id ? 'امکان حذف خود وجود ندارد' : 'حذف'}
              aria-label="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser, togglingId]
  )

  // ======== بخش لاگ فعالیت‌ها ========
  const {
    data: activitiesRaw,
    loading: activitiesLoading,
    error: activitiesError,
    refetch: refetchActivities,
  } = useApi(() => reportService.getActivities({ _limit: 1000 }), [])

  const [actUserFilter, setActUserFilter] = useState('')
  const [actActionFilter, setActActionFilter] = useState('')
  const [actSearch, setActSearch] = useState('')
  const [actPage, setActPage] = useState(1)

  // نقشه کاربران برای resolve نام
  const userMap = useMemo(() => {
    const map = {}
    ;(usersRaw || []).forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [usersRaw])

  // فیلتر فعالیت‌ها
  const filteredActivities = useMemo(() => {
    if (!activitiesRaw) return []
    let list = activitiesRaw
    if (actUserFilter) {
      list = list.filter((a) => String(a.userId) === actUserFilter)
    }
    if (actActionFilter) {
      list = list.filter((a) => a.action === actActionFilter)
    }
    if (actSearch.trim()) {
      const q = actSearch.trim().toLowerCase()
      list = list.filter(
        (a) =>
          (a.description && a.description.toLowerCase().includes(q)) ||
          (a.action && a.action.toLowerCase().includes(q))
      )
    }
    return list
  }, [activitiesRaw, actUserFilter, actActionFilter, actSearch])

  // pagination فعالیت‌ها
  const actTotalPages = Math.max(1, Math.ceil(filteredActivities.length / PAGE_SIZE))
  const safeActPage = Math.min(actPage, actTotalPages)
  const pagedActivities = useMemo(() => {
    const start = (safeActPage - 1) * PAGE_SIZE
    return filteredActivities.slice(start, start + PAGE_SIZE)
  }, [filteredActivities, safeActPage])

  useEffect(() => {
    setActPage(1)
  }, [actUserFilter, actActionFilter, actSearch])

  const hasActFilters = !!actUserFilter || !!actActionFilter || !!actSearch

  const handleResetActFilters = () => {
    setActUserFilter('')
    setActActionFilter('')
    setActSearch('')
  }

  // ستون‌های جدول فعالیت‌ها
  const activityColumns = useMemo(
    () => [
      {
        key: 'userId',
        header: 'کاربر',
        sortable: false,
        render: (row) => {
          const u = userMap[row.userId]
          return (
            <div className="flex items-center gap-2.5">
              <Avatar name={u?.name || '؟'} size="sm" />
              <span className="text-sm font-medium text-content">
                {u?.name || 'کاربر حذف‌شده'}
              </span>
            </div>
          )
        },
      },
      {
        key: 'action',
        header: 'اکشن',
        render: (row) => {
          const meta = ACTION_META[row.action] || { label: row.action, color: 'gray' }
          return <Badge color={meta.color}>{meta.label}</Badge>
        },
      },
      {
        key: 'description',
        header: 'توضیحات',
        render: (row) => (
          <span className="text-sm text-content-muted leading-relaxed">
            {row.description || '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'تاریخ و زمان',
        render: (row) => (
          <span className="text-content-muted text-xs whitespace-nowrap">
            {toJalaliDateTime(row.createdAt)}
          </span>
        ),
      },
    ],
    [userMap]
  )

  // ======== رندر ========
  if (usersError) {
    return (
      <div className="space-y-6">
        <PageHeader title="تنظیمات" icon={SettingsIcon} />
        <EmptyState
          icon={AlertCircle}
          title="خطا در بارگذاری"
          description={usersError}
          action={<Button onClick={refetchUsers}>تلاش مجدد</Button>}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* هدر صفحه */}
      <PageHeader
        title="تنظیمات"
        description="مدیریت کاربران و مشاهده لاگ فعالیت‌های سیستم"
        icon={SettingsIcon}
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleAddUser}
          >
            افزودن کاربر
          </Button>
        }
      />

      {/* ======== بخش ۱: مدیریت کاربران ======== */}
      <section className="space-y-4">
        {/* عنوان بخش */}
        <ScrollAnimate type="fade-up" delay={0}>
<div
          className="flex items-center gap-3 pb-2 border-b border-border"
        >
          <div className="p-2 rounded-xl bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400">
            <UsersIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-content">مدیریت کاربران</h2>
            <p className="text-sm text-content-muted">
              افزودن، ویرایش و مدیریت دسترسی کاربران سیستم
            </p>
          </div>
        </div>
</ScrollAnimate>

        {/* جستجوی کاربر */}
        <ScrollAnimate type="fade-up" delay={100}>
<div>
          <SearchBar
            value={userSearch}
            onChange={setUserSearch}
            placeholder="جستجوی کاربر بر اساس نام، ایمیل یا موبایل…"
          />
        </div>
</ScrollAnimate>

        {/* فیلتر کاربران */}
        <ScrollAnimate type="fade-up" delay={200}>
<div>
          <FilterBar
            onReset={handleResetUserFilters}
            hasActiveFilters={!!hasUserFilters}
            title="فیلتر کاربران"
          >
            <FilterItem label="نقش">
              <Select
                options={[
                  { value: 'admin', label: ROLE_LABELS.admin },
                  { value: 'advisor', label: ROLE_LABELS.advisor },
                  { value: 'assistant', label: ROLE_LABELS.assistant },
                ]}
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                placeholder="همه نقش‌ها"
              />
            </FilterItem>
            <FilterItem label="تعداد کل">
              <div className="h-10 px-3.5 flex items-center text-sm text-content-muted bg-surface-muted/40 rounded-xl border border-border">
                {fa(filteredUsers.length)} کاربر
              </div>
            </FilterItem>
          </FilterBar>
        </div>
</ScrollAnimate>

        {/* جدول کاربران یا skeleton یا empty */}
        {usersLoading ? (
          <div className="surface-card p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <ScrollAnimate type="fade" delay={0}>
<div className="surface-card">
            <EmptyState
              icon={Inbox}
              title="کاربری یافت نشد"
              description={
                hasUserFilters
                  ? 'فیلترها را تغییر دهید یا پاک کنید'
                  : 'هنوز کاربری ثبت نشده است'
              }
              action={
                hasUserFilters ? (
                  <Button variant="secondary" onClick={handleResetUserFilters}>
                    پاک کردن فیلترها
                  </Button>
                ) : (
                  <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddUser}>
                    افزودن اولین کاربر
                  </Button>
                )
              }
            />
          </div>
</ScrollAnimate>
        ) : (
          <ScrollAnimate type="fade-up" delay={300}>
<div>
            <Table
              columns={userColumns}
              data={pagedUsers}
              rowKey="id"
              initialSort={{ field: 'createdAt', direction: 'desc' }}
            />
            <Pagination
              page={safeUserPage}
              totalPages={userTotalPages}
              onChange={setUserPage}
              totalItems={filteredUsers.length}
              pageSize={PAGE_SIZE}
            />
          </div>
</ScrollAnimate>
        )}
      </section>

      {/* ======== بخش ۲: لاگ فعالیت‌ها ======== */}
      <section className="space-y-4">
        {/* عنوان بخش */}
        <ScrollAnimate type="fade-up" delay={0}>
<div
          className="flex items-center gap-3 pb-2 border-b border-border"
        >
          <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <ActivityIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-content">لاگ فعالیت‌ها</h2>
            <p className="text-sm text-content-muted">
              مشاهده رویدادها و فعالیت‌های انجام‌شده در سیستم
            </p>
          </div>
        </div>
</ScrollAnimate>

        {/* فیلتر فعالیت‌ها */}
        <ScrollAnimate type="fade-up" delay={100}>
<div>
          <FilterBar
            onReset={handleResetActFilters}
            hasActiveFilters={!!hasActFilters}
            title="فیلتر فعالیت‌ها"
          >
            <FilterItem label="کاربر">
              <Select
                options={(usersRaw || []).map((u) => ({
                  value: String(u.id),
                  label: `${u.name} — ${ROLE_LABELS[u.role] || u.role}`,
                }))}
                value={actUserFilter}
                onChange={(e) => setActUserFilter(e.target.value)}
                placeholder="همه کاربران"
              />
            </FilterItem>
            <FilterItem label="نوع اکشن">
              <Select
                options={ACTION_OPTIONS}
                value={actActionFilter}
                onChange={(e) => setActActionFilter(e.target.value)}
                placeholder="همه اکشن‌ها"
              />
            </FilterItem>
            <FilterItem label="تعداد کل">
              <div className="h-10 px-3.5 flex items-center text-sm text-content-muted bg-surface-muted/40 rounded-xl border border-border">
                {fa(filteredActivities.length)} رویداد
              </div>
            </FilterItem>
          </FilterBar>
        </div>
</ScrollAnimate>

        {/* جستجوی متن در توضیحات */}
        <ScrollAnimate type="fade-up" delay={150}>
<div>
          <SearchBar
            value={actSearch}
            onChange={setActSearch}
            placeholder="جستجو در توضیحات فعالیت‌ها…"
          />
        </div>
</ScrollAnimate>

        {/* جدول فعالیت‌ها */}
        {activitiesLoading ? (
          <div className="surface-card p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : activitiesError ? (
          <div className="surface-card">
            <EmptyState
              icon={AlertCircle}
              title="خطا در بارگذاری فعالیت‌ها"
              description={activitiesError}
              action={<Button onClick={refetchActivities}>تلاش مجدد</Button>}
            />
          </div>
        ) : filteredActivities.length === 0 ? (
          <ScrollAnimate type="fade" delay={0}>
<div className="surface-card">
            <EmptyState
              icon={Inbox}
              title="فعالیتی یافت نشد"
              description={
                hasActFilters
                  ? 'فیلترها را تغییر دهید یا پاک کنید'
                  : 'هنوز فعالیتی ثبت نشده است'
              }
              action={
                hasActFilters ? (
                  <Button variant="secondary" onClick={handleResetActFilters}>
                    پاک کردن فیلترها
                  </Button>
                ) : null
              }
            />
          </div>
</ScrollAnimate>
        ) : (
          <ScrollAnimate type="fade-up" delay={200}>
<div>
            <Table
              columns={activityColumns}
              data={pagedActivities}
              rowKey="id"
              initialSort={{ field: 'createdAt', direction: 'desc' }}
            />
            <Pagination
              page={safeActPage}
              totalPages={actTotalPages}
              onChange={setActPage}
              totalItems={filteredActivities.length}
              pageSize={PAGE_SIZE}
            />
          </div>
</ScrollAnimate>
        )}
      </section>

      {/* ======== مودال‌ها ======== */}
      <UserForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        user={editingUser}
        onSubmitSuccess={refetchUsers}
      />

      <ChangePasswordModal
        open={!!passwordTarget}
        onClose={() => setPasswordTarget(null)}
        user={passwordTarget}
        onSuccess={refetchUsers}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
        title="حذف کاربر"
        message={`آیا از حذف کاربر «${deleteTarget?.name || ''}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`}
        confirmText="حذف"
        loading={deleting}
      />
    </div>
  )
}
