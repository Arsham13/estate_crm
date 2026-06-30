// Customers — صفحه مدیریت مشتریان با جستجو، فیلتر، جدول قابل مرتب‌سازی، pagination، export CSV
import ScrollAnimate from '../components/common/ScrollAnimate.jsx'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Users as UsersIcon,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Download,
  AlertCircle,
  Inbox,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { useApi } from '../hooks/useApi.js'
import { customerService } from '../services/customerService.js'
import { authService } from '../services/authService.js'
import { reportService } from '../services/reportService.js'
import PageHeader from '../components/common/PageHeader.jsx'
import Button from '../components/common/Button.jsx'
import SearchBar from '../components/common/SearchBar.jsx'
import FilterBar, { FilterItem } from '../components/common/FilterBar.jsx'
import Select from '../components/common/Select.jsx'
import Table from '../components/common/Table.jsx'
import Badge from '../components/common/Badge.jsx'
import Pagination from '../components/common/Pagination.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { Skeleton } from '../components/common/LoadingSpinner.jsx'
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'
import CustomerForm from '../components/customers/CustomerForm.jsx'
import CustomerProfile from '../components/customers/CustomerProfile.jsx'
import {
  CUSTOMER_TYPES,
  CUSTOMER_SOURCES,
  PIPELINE_STAGES,
  DATE_RANGES,
} from '../utils/constants.js'
import { toJalali, formatCompactCurrency } from '../utils/formatters.js'
import { getLabel, getColor, filterByDateRange } from '../utils/helpers.js'
import { downloadCSV } from '../utils/exportCSV.js'

const PAGE_SIZE = 10
const fa = (n) => Number(n || 0).toLocaleString('fa-IR')

export default function Customers() {
  const { user, canWrite, hasRole } = useAuth()
  const isAdmin = hasRole(['admin'])
  const isAssistant = user?.role === 'assistant'
  // admin همه، advisor فقط خودش، assistant همه (read-only)
  const seesAll = isAdmin || isAssistant

  // واکشی اولیه
  const {
    data: customersRaw,
    loading,
    error,
    refetch,
  } = useApi(() => customerService.getAll({ _limit: 1000 }), [])

  const { data: users } = useApi(() => authService.getAll(), [])

  // state فیلترها
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterAdvisor, setFilterAdvisor] = useState('')
  const [filterDate, setFilterDate] = useState('all')
  const [page, setPage] = useState(1)

  // state مودال‌ها
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileCustomer, setProfileCustomer] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // نقشه کاربران برای resolve نام مشاور
  const userMap = useMemo(() => {
    const map = {}
    ;(users || []).forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

  // اعمال فیلتر نقش + جستجو + فیلترها
  const filtered = useMemo(() => {
    if (!customersRaw) return []
    let list = customersRaw

    // فیلتر نقش
    if (!seesAll) {
      list = list.filter((c) => c.assignedTo === user?.id)
    }

    // جستجو
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      )
    }

    if (filterType) list = list.filter((c) => c.type === filterType)
    if (filterSource) list = list.filter((c) => c.source === filterSource)
    if (filterAdvisor) list = list.filter((c) => String(c.assignedTo) === filterAdvisor)

    // فیلتر بازه زمانی
    list = filterByDateRange(list, 'createdAt', filterDate)

    return list
  }, [customersRaw, seesAll, user, search, filterType, filterSource, filterAdvisor, filterDate])

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  // reset صفحه هنگام تغییر فیلترها
  useEffect(() => {
    setPage(1)
  }, [search, filterType, filterSource, filterAdvisor, filterDate])

  const hasActiveFilters =
    search || filterType || filterSource || filterAdvisor || filterDate !== 'all'

  const handleResetFilters = () => {
    setSearch('')
    setFilterType('')
    setFilterSource('')
    setFilterAdvisor('')
    setFilterDate('all')
  }

  const handleAdd = () => {
    setEditingCustomer(null)
    setFormOpen(true)
  }

  const handleEdit = (customer) => {
    setProfileOpen(false)
    setEditingCustomer(customer)
    setFormOpen(true)
  }

  const handleView = (customer) => {
    setProfileCustomer(customer)
    setProfileOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const tid = toast.loading('در حال حذف…')
    try {
      await customerService.remove(deleteTarget.id)
      toast.success('مشتری حذف شد', { id: tid })
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(err.message || 'خطا در حذف مشتری', { id: tid })
    } finally {
      setDeleting(false)
    }
  }

  // خروجی CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('داده‌ای برای خروجی وجود ندارد')
      return
    }
    const rows = filtered.map((c) => ({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      type: getLabel(CUSTOMER_TYPES, c.type),
      source: getLabel(CUSTOMER_SOURCES, c.source),
      stage: getLabel(PIPELINE_STAGES, c.pipelineStage),
      budget: c.budget,
      advisor: userMap[c.assignedTo]?.name || '',
      createdAt: toJalali(c.createdAt),
    }))
    const columns = [
      { key: 'name', label: 'نام' },
      { key: 'phone', label: 'موبایل' },
      { key: 'email', label: 'ایمیل' },
      { key: 'type', label: 'نوع' },
      { key: 'source', label: 'منبع' },
      { key: 'stage', label: 'مرحله' },
      { key: 'budget', label: 'بودجه' },
      { key: 'advisor', label: 'مشاور' },
      { key: 'createdAt', label: 'تاریخ ثبت' },
    ]
    downloadCSV(rows, columns, `customers-${Date.now()}.csv`)
    toast.success('فایل CSV دانلود شد')
  }

  // ستون‌های جدول
  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'نام مشتری',
        render: (row) => (
          <button
            type="button"
            onClick={() => handleView(row)}
            className="press-effect inline-flex items-center gap-2 text-right cursor-pointer group"
            title="مشاهده پروفایل"
          >
            <span className="w-8 h-8 rounded-full bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-300 flex items-center justify-center text-xs font-bold shrink-0">
              {(row.name || '؟').slice(0, 1)}
            </span>
            <span className="font-medium text-content group-hover:text-gold-700 dark:group-hover:text-gold-400 transition-colors">
              {row.name}
            </span>
          </button>
        ),
      },
      {
        key: 'phone',
        header: 'موبایل',
        render: (row) => (
          <span dir="ltr" className="text-content-muted">
            {row.phone}
          </span>
        ),
      },
      {
        key: 'type',
        header: 'نوع',
        render: (row) => (
          <Badge color="gray">{getLabel(CUSTOMER_TYPES, row.type)}</Badge>
        ),
      },
      {
        key: 'source',
        header: 'منبع',
        render: (row) => (
          <Badge color="info">{getLabel(CUSTOMER_SOURCES, row.source)}</Badge>
        ),
      },
      {
        key: 'assignedTo',
        header: 'مشاور',
        sortable: false,
        render: (row) => (
          <span className="text-content-muted">
            {userMap[row.assignedTo]?.name || '—'}
          </span>
        ),
      },
      {
        key: 'pipelineStage',
        header: 'مرحله',
        render: (row) => (
          <Badge color={getColor(PIPELINE_STAGES, row.pipelineStage, 'gray')} dot>
            {getLabel(PIPELINE_STAGES, row.pipelineStage)}
          </Badge>
        ),
      },
      {
        key: 'budget',
        header: 'بودجه',
        render: (row) => (
          <span className="text-content font-medium">
            {row.budget ? `${formatCompactCurrency(row.budget)} ت` : '—'}
          </span>
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
              onClick={() => handleView(row)}
              className="press-effect p-1.5 rounded-lg text-content-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
              title="مشاهده"
              aria-label="مشاهده"
            >
              <Eye className="w-4 h-4" />
            </button>
            {canWrite() && (
              <>
                <button
                  type="button"
                  onClick={() => handleEdit(row)}
                  className="press-effect p-1.5 rounded-lg text-content-muted hover:text-gold-700 hover:bg-gold-50 dark:hover:bg-gold-900/20 cursor-pointer transition-colors"
                  title="ویرایش"
                  aria-label="ویرایش"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(row)}
                  className="press-effect p-1.5 rounded-lg text-content-muted hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                  title="حذف"
                  aria-label="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userMap, canWrite]
  )

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="مشتریان" icon={UsersIcon} />
        <EmptyState
          icon={AlertCircle}
          title="خطا در بارگذاری"
          description={error}
          action={<Button onClick={refetch}>تلاش مجدد</Button>}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="مشتریان"
        description={
          seesAll
            ? 'مدیریت کامل مشتریان، فیلتر و جستجو'
            : 'مشتریان اختصاص‌یافته به شما'
        }
        icon={UsersIcon}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportCSV}
              disabled={loading || filtered.length === 0}
            >
              خروجی CSV
            </Button>
            {canWrite() && (
              <Button
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleAdd}
              >
                افزودن مشتری
              </Button>
            )}
          </div>
        }
      />

      {/* جستجو */}
      <ScrollAnimate type="fade-up" delay={0}>
<div>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="جستجو بر اساس نام، موبایل یا ایمیل…"
        />
      </div>
</ScrollAnimate>

      {/* فیلترها */}
      <ScrollAnimate type="fade-up" delay={100}>
<div>
        <FilterBar
          onReset={handleResetFilters}
          hasActiveFilters={!!hasActiveFilters}
          title="فیلترهای پیشرفته"
        >
          <FilterItem label="نوع مشتری">
            <Select
              options={CUSTOMER_TYPES}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              placeholder="همه انواع"
            />
          </FilterItem>
          <FilterItem label="منبع آشنایی">
            <Select
              options={CUSTOMER_SOURCES}
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              placeholder="همه منابع"
            />
          </FilterItem>
          {isAdmin && (
            <FilterItem label="مشاور">
              <Select
                options={(users || [])
                  .filter((u) => u.role === 'advisor')
                  .map((u) => ({ value: String(u.id), label: u.name }))}
                value={filterAdvisor}
                onChange={(e) => setFilterAdvisor(e.target.value)}
                placeholder="همه مشاوران"
              />
            </FilterItem>
          )}
          <FilterItem label="بازه زمانی">
            <Select
              options={DATE_RANGES}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              placeholder="همه"
            />
          </FilterItem>
        </FilterBar>
      </div>
</ScrollAnimate>

      {/* خلاصه تعداد */}
      <ScrollAnimate type="fade-up" delay={200}>
<div className="flex items-center justify-between text-sm text-content-muted">
        <span>
          مجموع: <span className="font-semibold text-content">{fa(filtered.length)}</span> مشتری
        </span>
        {loading && <span className="text-xs">در حال بارگذاری…</span>}
      </div>
</ScrollAnimate>

      {/* جدول یا skeleton یا empty */}
      {loading ? (
        <div className="surface-card p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <ScrollAnimate type="fade" delay={0}>
<div className="surface-card">
          <EmptyState
            icon={Inbox}
            title="مشتری‌ای یافت نشد"
            description={
              hasActiveFilters
                ? 'فیلترها را تغییر دهید یا پاک کنید'
                : 'هنوز مشتری‌ای ثبت نشده است'
            }
            action={
              canWrite() && !hasActiveFilters ? (
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
                  افزودن اولین مشتری
                </Button>
              ) : hasActiveFilters ? (
                <Button variant="secondary" onClick={handleResetFilters}>
                  پاک کردن فیلترها
                </Button>
              ) : null
            }
          />
        </div>
</ScrollAnimate>
      ) : (
        <ScrollAnimate type="fade-up" delay={300}>
<div>
          <Table
            columns={columns}
            data={paged}
            initialSort={{ field: 'createdAt', direction: 'desc' }}
          />
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={setPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </div>
</ScrollAnimate>
      )}

      {/* مودال فرم */}
      <CustomerForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        customer={editingCustomer}
        onSubmitSuccess={refetch}
      />

      {/* مودال پروفایل */}
      <CustomerProfile
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        customer={profileCustomer}
        canEdit={canWrite()}
        onEdit={handleEdit}
      />

      {/* تأیید حذف */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف مشتری"
        message={`آیا از حذف «${deleteTarget?.name || ''}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`}
        confirmText="حذف"
        loading={deleting}
      />
    </div>
  )
}
