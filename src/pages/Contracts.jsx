// Contracts — صفحه مدیریت قراردادها با فیلتر، جدول sortable، detail modal، export CSV و pagination
import ScrollAnimate from '../components/common/ScrollAnimate.jsx'
import React, { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Download,
  AlertCircle,
  Inbox,
  User,
  Phone,
  Building2,
  CalendarClock,
  Wallet,
  Percent,
  StickyNote,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { useApi } from '../hooks/useApi.js'
import { contractService } from '../services/contractService.js'
import { customerService } from '../services/customerService.js'
import { propertyService } from '../services/propertyService.js'
import { authService } from '../services/authService.js'
import PageHeader from '../components/common/PageHeader.jsx'
import Button from '../components/common/Button.jsx'
import FilterBar, { FilterItem } from '../components/common/FilterBar.jsx'
import Select from '../components/common/Select.jsx'
import Table from '../components/common/Table.jsx'
import Badge from '../components/common/Badge.jsx'
import Card, { CardHeader } from '../components/common/Card.jsx'
import Pagination from '../components/common/Pagination.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { Skeleton } from '../components/common/LoadingSpinner.jsx'
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'
import Modal from '../components/common/Modal.jsx'
import ContractForm from '../components/contracts/ContractForm.jsx'
import {
  CONTRACT_TYPES,
  CONTRACT_STATUS,
  DATE_RANGES,
} from '../utils/constants.js'
import { formatCurrency, toJalali, toJalaliDateTime } from '../utils/formatters.js'
import { getLabel, filterByDateRange } from '../utils/helpers.js'
import { downloadCSV } from '../utils/exportCSV.js'

const PAGE_SIZE = 10
const fa = (n) => Number(n || 0).toLocaleString('fa-IR')

// رنگ بج برای نوع قرارداد
const TYPE_COLOR = {
  sale: 'success',
  rent: 'info',
  mortgage: 'purple',
}

// رنگ بج برای وضعیت قرارداد
const STATUS_COLOR = {
  active: 'success',
  expired: 'warning',
  canceled: 'error',
}

// تبدیل ISO به YYYY-MM-DD برای input[type=date]
function isoToDateInput(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

// ردیف اطلاعات در مودال جزئیات
function DetailRow({ icon: Icon, label, value, dir }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="shrink-0 p-1.5 rounded-lg bg-surface-muted text-content-muted">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-content-muted">{label}</p>
        <p className={`text-sm font-medium text-content break-words ${dir === 'ltr' ? 'text-right' : ''}`} dir={dir}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

// مودال جزئیات قرارداد
function ContractDetailModal({ open, onClose, contract, customerMap, propertyMap, userMap, onEdit, canEdit }) {
  if (!contract) return null
  const customer = customerMap[contract.customerId]
  const property = propertyMap[contract.propertyId]
  const advisor = userMap[contract.advisorId]

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="جزئیات قرارداد"
      description={contract.code}
      footer={
        canEdit ? (
          <Button size="sm" leftIcon={<Pencil className="w-4 h-4" />} onClick={() => onEdit(contract)}>
            ویرایش
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {/* خلاصه بالایی */}
        <ScrollAnimate type="fade" delay={0}>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-surface border border-border">
            <p className="text-xs text-content-muted">نوع</p>
            <Badge color={TYPE_COLOR[contract.type] || 'gray'}>{getLabel(CONTRACT_TYPES, contract.type)}</Badge>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border">
            <p className="text-xs text-content-muted">وضعیت</p>
            <Badge color={STATUS_COLOR[contract.status] || 'gray'} dot>
              {getLabel(CONTRACT_STATUS, contract.status)}
            </Badge>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border">
            <p className="text-xs text-content-muted">مبلغ</p>
            <p className="text-sm font-bold text-content">{formatCurrency(contract.amount)} ت</p>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border">
            <p className="text-xs text-content-muted">کمیسیون</p>
            <p className="text-sm font-bold text-gold-700 dark:text-gold-400">{formatCurrency(contract.commission)} ت</p>
          </div>
        </div>
</ScrollAnimate>

        {/* اطلاعات طرفین */}
        <Card padding="p-5">
          <CardHeader title="اطلاعات طرفین و تاریخ‌ها" icon={<FileText className="w-5 h-5" />} />
          <div className="divide-y divide-border">
            <DetailRow icon={User} label="مشتری" value={customer ? `${customer.name}` : '—'} />
            <DetailRow icon={Phone} label="شماره تماس مشتری" value={customer?.phone} dir="ltr" />
            <DetailRow icon={Building2} label="کد ملک" value={property?.code || '—'} />
            <DetailRow icon={User} label="مشاور مسئول" value={advisor?.name || '—'} />
            <DetailRow icon={CalendarClock} label="تاریخ شروع" value={toJalali(contract.startDate)} />
            <DetailRow icon={CalendarClock} label="تاریخ پایان" value={toJalali(contract.endDate)} />
            <DetailRow icon={Wallet} label="مبلغ قرارداد" value={`${formatCurrency(contract.amount)} ت`} />
            <DetailRow icon={Percent} label="نرخ کمیسیون" value={
              contract.amount > 0
                ? `${((Number(contract.commission) / Number(contract.amount)) * 100).toLocaleString('fa-IR', { maximumFractionDigits: 2 })}٪`
                : '—'
            } />
            <DetailRow icon={CalendarClock} label="تاریخ ثبت" value={toJalaliDateTime(contract.createdAt)} />
          </div>
        </Card>

        {/* یادداشت */}
        {contract.note ? (
          <Card padding="p-5">
            <CardHeader title="یادداشت" icon={<StickyNote className="w-5 h-5" />} />
            <p className="text-sm text-content leading-7 whitespace-pre-wrap bg-surface-muted/50 rounded-xl p-3">
              {contract.note}
            </p>
          </Card>
        ) : null}
      </div>
    </Modal>
  )
}

export default function Contracts() {
  const { user, canWrite, hasRole } = useAuth()
  const isAdmin = hasRole(['admin'])
  const isAssistant = user?.role === 'assistant'
  // admin همه، advisor فقط خودش، assistant همه (read-only)
  const seesAll = isAdmin || isAssistant

  const {
    data: contractsRaw,
    loading,
    error,
    refetch,
  } = useApi(() => contractService.getAll({ _limit: 1000 }), [])

  const { data: users } = useApi(() => authService.getAll(), [])
  const { data: customers } = useApi(() => customerService.getAll({ _limit: 1000 }), [])
  const { data: properties } = useApi(() => propertyService.getAll({ _limit: 1000 }), [])

  // فیلترها
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterAdvisor, setFilterAdvisor] = useState('')
  const [filterDate, setFilterDate] = useState('all')
  const [page, setPage] = useState(1)

  // مودال‌ها
  const [formOpen, setFormOpen] = useState(false)
  const [editingContract, setEditingContract] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailContract, setDetailContract] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // نقشه‌ها برای resolve نام‌ها
  const userMap = useMemo(() => {
    const m = {}
    ;(users || []).forEach((u) => { m[u.id] = u })
    return m
  }, [users])

  const customerMap = useMemo(() => {
    const m = {}
    ;(customers || []).forEach((c) => { m[c.id] = c })
    return m
  }, [customers])

  const propertyMap = useMemo(() => {
    const m = {}
    ;(properties || []).forEach((p) => { m[p.id] = p })
    return m
  }, [properties])

  const filtered = useMemo(() => {
    if (!contractsRaw) return []
    let list = contractsRaw

    // فیلتر نقش
    if (!seesAll) {
      list = list.filter((c) => c.advisorId === user?.id)
    }

    if (filterType) list = list.filter((c) => c.type === filterType)
    if (filterStatus) list = list.filter((c) => c.status === filterStatus)
    if (filterAdvisor) list = list.filter((c) => String(c.advisorId) === filterAdvisor)

    list = filterByDateRange(list, 'startDate', filterDate)
    return list
  }, [contractsRaw, seesAll, user, filterType, filterStatus, filterAdvisor, filterDate])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  useEffect(() => {
    setPage(1)
  }, [filterType, filterStatus, filterAdvisor, filterDate])

  const hasActiveFilters = filterType || filterStatus || filterAdvisor || filterDate !== 'all'

  const handleResetFilters = () => {
    setFilterType('')
    setFilterStatus('')
    setFilterAdvisor('')
    setFilterDate('all')
  }

  const handleAdd = () => {
    setEditingContract(null)
    setFormOpen(true)
  }

  const handleEdit = (contract) => {
    setDetailOpen(false)
    setEditingContract(contract)
    setFormOpen(true)
  }

  const handleView = (contract) => {
    setDetailContract(contract)
    setDetailOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const tid = toast.loading('در حال حذف…')
    try {
      await contractService.remove(deleteTarget.id)
      toast.success('قرارداد حذف شد', { id: tid })
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(err.message || 'خطا در حذف قرارداد', { id: tid })
    } finally {
      setDeleting(false)
    }
  }

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('داده‌ای برای خروجی وجود ندارد')
      return
    }
    const rows = filtered.map((c) => ({
      code: c.code || '',
      type: getLabel(CONTRACT_TYPES, c.type),
      customer: customerMap[c.customerId]?.name || '',
      property: propertyMap[c.propertyId]?.code || '',
      advisor: userMap[c.advisorId]?.name || '',
      startDate: toJalali(c.startDate),
      endDate: toJalali(c.endDate),
      amount: c.amount,
      commission: c.commission,
      status: getLabel(CONTRACT_STATUS, c.status),
    }))
    const columns = [
      { key: 'code', label: 'کد' },
      { key: 'type', label: 'نوع' },
      { key: 'customer', label: 'مشتری' },
      { key: 'property', label: 'ملک' },
      { key: 'advisor', label: 'مشاور' },
      { key: 'startDate', label: 'شروع' },
      { key: 'endDate', label: 'پایان' },
      { key: 'amount', label: 'مبلغ' },
      { key: 'commission', label: 'کمیسیون' },
      { key: 'status', label: 'وضعیت' },
    ]
    downloadCSV(rows, columns, `contracts-${Date.now()}.csv`)
    toast.success('فایل CSV دانلود شد')
  }

  const columns = useMemo(
    () => [
      {
        key: 'code',
        header: 'کد',
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-gold-700 dark:text-gold-400">
            {row.code || '—'}
          </span>
        ),
      },
      {
        key: 'type',
        header: 'نوع',
        render: (row) => (
          <Badge color={TYPE_COLOR[row.type] || 'gray'}>{getLabel(CONTRACT_TYPES, row.type)}</Badge>
        ),
      },
      {
        key: 'customerId',
        header: 'مشتری',
        sortable: false,
        render: (row) => (
          <span className="text-content font-medium">
            {customerMap[row.customerId]?.name || '—'}
          </span>
        ),
      },
      {
        key: 'propertyId',
        header: 'ملک',
        sortable: false,
        render: (row) => (
          <span className="font-mono text-xs text-content-muted">
            {propertyMap[row.propertyId]?.code || '—'}
          </span>
        ),
      },
      {
        key: 'advisorId',
        header: 'مشاور',
        sortable: false,
        render: (row) => (
          <span className="text-content-muted">{userMap[row.advisorId]?.name || '—'}</span>
        ),
      },
      {
        key: 'startDate',
        header: 'شروع',
        render: (row) => (
          <span className="text-content-muted text-xs">{toJalali(row.startDate)}</span>
        ),
      },
      {
        key: 'endDate',
        header: 'پایان',
        render: (row) => (
          <span className="text-content-muted text-xs">{toJalali(row.endDate)}</span>
        ),
      },
      {
        key: 'amount',
        header: 'مبلغ',
        render: (row) => (
          <span className="text-content font-medium">
            {formatCurrency(row.amount)} <span className="text-[10px] text-content-muted">ت</span>
          </span>
        ),
      },
      {
        key: 'commission',
        header: 'کمیسیون',
        render: (row) => (
          <span className="text-gold-700 dark:text-gold-400 font-medium">
            {formatCurrency(row.commission)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'وضعیت',
        render: (row) => (
          <Badge color={STATUS_COLOR[row.status] || 'gray'} dot>
            {getLabel(CONTRACT_STATUS, row.status)}
          </Badge>
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
              title="مشاهده جزئیات"
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
    [customerMap, propertyMap, userMap, canWrite]
  )

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="قراردادها" icon={FileText} />
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
        title="قراردادها"
        description={seesAll ? 'مدیریت قراردادهای فروش، اجاره و رهن' : 'قراردادهای اختصاص‌یافته به شما'}
        icon={FileText}
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
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
                افزودن قرارداد
              </Button>
            )}
          </div>
        }
      />

      {/* فیلترها */}
      <ScrollAnimate type="fade-up" delay={0}>
<div>
        <FilterBar
          onReset={handleResetFilters}
          hasActiveFilters={!!hasActiveFilters}
          title="فیلترهای قراردادها"
        >
          <FilterItem label="نوع قرارداد">
            <Select
              options={CONTRACT_TYPES}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              placeholder="همه انواع"
            />
          </FilterItem>
          <FilterItem label="وضعیت">
            <Select
              options={CONTRACT_STATUS}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              placeholder="همه وضعیت‌ها"
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
      <ScrollAnimate type="fade-up" delay={100}>
<div className="flex items-center justify-between text-sm text-content-muted">
        <span>
          مجموع: <span className="font-semibold text-content">{fa(filtered.length)}</span> قرارداد
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
            title="قراردادی یافت نشد"
            description={hasActiveFilters ? 'فیلترها را تغییر دهید یا پاک کنید' : 'هنوز قراردادی ثبت نشده است'}
            action={
              canWrite() && !hasActiveFilters ? (
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
                  افزودن اولین قرارداد
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
        <ScrollAnimate type="fade-up" delay={200}>
<div>
          <Table
            columns={columns}
            data={paged}
            initialSort={{ field: 'startDate', direction: 'desc' }}
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
      <ContractForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        contract={editingContract}
        onSubmitSuccess={refetch}
      />

      {/* مودال جزئیات */}
      <ContractDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        contract={detailContract}
        customerMap={customerMap}
        propertyMap={propertyMap}
        userMap={userMap}
        onEdit={handleEdit}
        canEdit={canWrite()}
      />

      {/* تأیید حذف */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف قرارداد"
        message={`آیا از حذف قرارداد «${deleteTarget?.code || ''}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`}
        confirmText="حذف"
        loading={deleting}
      />
    </div>
  )
}
