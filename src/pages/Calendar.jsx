// Calendar — صفحه تقویم با نمایش وظایف و بازدیدها (react-big-calendar + date-fns)
import ScrollAnimate from '../components/common/ScrollAnimate.jsx'
import React, { useState, useMemo, useCallback } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { faIR, enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  Calendar as CalendarIcon,
  CheckSquare,
  Building2,
  Clock,
  User as UserIcon,
  Pencil,
  Trash2,
  AlertCircle,
  Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { useApi } from '../hooks/useApi.js'
import { taskService } from '../services/taskService.js'
import { visitService } from '../services/visitService.js'
import { customerService } from '../services/customerService.js'
import { propertyService } from '../services/propertyService.js'
import PageHeader from '../components/common/PageHeader.jsx'
import Button from '../components/common/Button.jsx'
import Modal from '../components/common/Modal.jsx'
import Badge from '../components/common/Badge.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'
import TaskForm from '../components/tasks/TaskForm.jsx'
import VisitForm from '../components/visits/VisitForm.jsx'
import {
  TASK_PRIORITY,
  TASK_STATUS,
  VISIT_STATUS,
  VISIT_RESULTS,
} from '../utils/constants.js'
import { toJalaliDateTime } from '../utils/formatters.js'
import { getColor } from '../utils/helpers.js'

// ----------------------------------------------------
// تنظیم localizer با date-fns و locale فارسی (faIR)
// در صورت نبود faIR، به en-US برمی‌گردیم.
// ----------------------------------------------------
const faIRLocale = faIR || enUS
const locales = { 'fa-IR': faIRLocale, 'en-US': enUS }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

// ----------------------------------------------------
// پیام‌های فارسی برای دکمه‌ها و اجزای تقویم
// ----------------------------------------------------
const messages = {
  date: 'تاریخ',
  time: 'ساعت',
  event: 'رویداد',
  allDay: 'تمام روز',
  week: 'هفته',
  day: 'روز',
  month: 'ماه',
  previous: 'قبلی',
  next: 'بعدی',
  yesterday: 'دیروز',
  tomorrow: 'فردا',
  today: 'امروز',
  agenda: 'دستور کار',
  noEventsInRange: 'رویدادی در این بازه نیست',
  showMore: (n) => `+${Number(n).toLocaleString('fa-IR')} رویداد دیگر`,
}

// ----------------------------------------------------
// فرمت‌های نمایش تاریخ فارسی
// ----------------------------------------------------
const formats = {
  dateFormat: 'dd',
  weekdayFormat: (date, culture, loc) => loc.format(date, 'EEEEEE', culture),
  dayHeaderFormat: (date, culture, loc) => loc.format(date, 'EEEE d MMMM', culture),
  dayRangeHeaderFormat: ({ start, end }, culture, loc) =>
    `${loc.format(start, 'd MMMM', culture)} — ${loc.format(end, 'd MMMM', culture)}`,
  monthHeaderFormat: (date, culture, loc) => loc.format(date, 'MMMM yyyy', culture),
  agendaHeaderFormat: ({ start, end }, culture, loc) =>
    `${loc.format(start, 'd MMM', culture)} — ${loc.format(end, 'd MMM yyyy', culture)}`,
  agendaTimeFormat: (date, culture, loc) => loc.format(date, 'HH:mm', culture),
  agendaTimeRangeFormat: ({ start, end }, culture, loc) =>
    `${loc.format(start, 'HH:mm', culture)} — ${loc.format(end, 'HH:mm', culture)}`,
  eventTimeRangeFormat: ({ start, end }, culture, loc) =>
    `${loc.format(start, 'HH:mm', culture)} — ${loc.format(end, 'HH:mm', culture)}`,
  timeGutterFormat: (date, culture, loc) => loc.format(date, 'HH:mm', culture),
}

// رنگ‌های رویدادها
const TASK_COLOR = '#D4A017'
const VISIT_COLOR = '#3B82F6'

// ----------------------------------------------------
// کامپوننت رویداد سفارشی (نقطه رنگی + عنوان)
// ----------------------------------------------------
function CustomEvent({ event }) {
  const color = event.color || TASK_COLOR
  return (
    <div
      className="flex items-center gap-1.5 px-1 py-0.5 text-xs leading-tight overflow-hidden"
      title={event.title}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="truncate font-medium text-content">{event.title}</span>
    </div>
  )
}

// ----------------------------------------------------
// ردیف اطلاعات در مودال جزئیات
// ----------------------------------------------------
function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="shrink-0 p-1.5 rounded-lg bg-surface-muted text-content-muted">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-content-muted">{label}</p>
        <p className="text-sm font-medium text-content break-words">{value || '—'}</p>
      </div>
    </div>
  )
}

// ----------------------------------------------------
// صفحه اصلی Calendar
// ----------------------------------------------------
export default function CalendarPage() {
  const { user, canWrite, hasRole } = useAuth()
  const isAdmin = hasRole(['admin'])
  const isAssistant = user?.role === 'assistant'
  const seesAll = isAdmin || isAssistant
  const readOnly = !canWrite()

  const {
    data: tasksRaw,
    loading: loadingTasks,
    refetch: refetchTasks,
  } = useApi(() => taskService.getAll({ _limit: 1000 }), [])
  const {
    data: visitsRaw,
    loading: loadingVisits,
    refetch: refetchVisits,
  } = useApi(() => visitService.getAll({ _limit: 1000 }), [])
  const { data: customers } = useApi(() => customerService.getAll({ _limit: 1000 }), [])
  const { data: properties } = useApi(() => propertyService.getAll({ _limit: 1000 }), [])

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

  // ساخت لیست رویدادها از tasks و visits
  const events = useMemo(() => {
    const taskEvents = (tasksRaw || []).map((t) => ({
      id: `task-${t.id}`,
      type: 'task',
      ref: t,
      title: t.title,
      start: t.dueDate ? new Date(t.dueDate) : new Date(),
      end: t.dueDate ? new Date(t.dueDate) : new Date(),
      color: TASK_COLOR,
      allDay: false,
    }))

    const visitEvents = (visitsRaw || []).map((v) => {
      const cust = customerMap[v.customerId]
      const prop = propertyMap[v.propertyId]
      return {
        id: `visit-${v.id}`,
        type: 'visit',
        ref: v,
        title: `${cust?.name || 'مشتری'} — ${prop?.code || ''}`,
        start: v.date ? new Date(v.date) : new Date(),
        end: v.date ? new Date(v.date) : new Date(),
        color: VISIT_COLOR,
        allDay: false,
      }
    })

    let all = [...taskEvents, ...visitEvents]
    if (!seesAll) {
      all = all.filter((e) =>
        e.type === 'task'
          ? e.ref.assignedTo === user?.id
          : e.ref.advisorId === user?.id
      )
    }
    return all
  }, [tasksRaw, visitsRaw, customerMap, propertyMap, seesAll, user])

  const [date, setDate] = useState(new Date())
  const [view, setView] = useState('month')

  // مودال انتخاب نوع رویداد هنگام کلیک روی slot
  const [slotInfo, setSlotInfo] = useState(null)

  // مودال فرم وظیفه
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskPrefillDate, setTaskPrefillDate] = useState(null)

  // مودال فرم بازدید
  const [visitFormOpen, setVisitFormOpen] = useState(false)
  const [editingVisit, setEditingVisit] = useState(null)
  const [visitPrefillDate, setVisitPrefillDate] = useState(null)

  // مودال جزئیات رویداد
  const [detailEvent, setDetailEvent] = useState(null)

  // تأیید حذف
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loading = loadingTasks || loadingVisits

  // کلیک روی slot خالی → باز کردن مودال انتخاب نوع
  const handleSelectSlot = useCallback(
    (info) => {
      if (readOnly) return
      // اگر در نمای روز/هفته بود و یک بازه زمانی انتخاب شد، از شروع آن استفاده می‌کنیم
      // در نمای ماه، start ابتدای روز است
      const startDate = info.start || new Date()
      setSlotInfo({ start: startDate })
    },
    [readOnly]
  )

  // کلیک روی یک رویداد → باز کردن مودال جزئیات
  const handleSelectEvent = useCallback((event) => {
    setDetailEvent(event)
  }, [])

  // افزودن وظیفه از روی slot
  const handleAddTaskFromSlot = () => {
    if (!slotInfo) return
    setEditingTask(null)
    setTaskPrefillDate(slotInfo.start.toISOString())
    setSlotInfo(null)
    setTaskFormOpen(true)
  }

  // افزودن بازدید از روی slot
  const handleAddVisitFromSlot = () => {
    if (!slotInfo) return
    setEditingVisit(null)
    setVisitPrefillDate(slotInfo.start.toISOString())
    setSlotInfo(null)
    setVisitFormOpen(true)
  }

  // ویرایش رویداد از داخل مودال جزئیات
  const handleEditFromDetail = () => {
    if (!detailEvent) return
    if (detailEvent.type === 'task') {
      setEditingTask(detailEvent.ref)
      setTaskPrefillDate(null)
      setTaskFormOpen(true)
    } else {
      setEditingVisit(detailEvent.ref)
      setVisitPrefillDate(null)
      setVisitFormOpen(true)
    }
    setDetailEvent(null)
  }

  // شروع فرآیند حذف از داخل مودال جزئیات
  const handleDeleteFromDetail = () => {
    if (!detailEvent) return
    setDeleteTarget(detailEvent)
    setDetailEvent(null)
  }

  // اجرای حذف
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const tid = toast.loading('در حال حذف…')
    try {
      if (deleteTarget.type === 'task') {
        await taskService.remove(deleteTarget.ref.id)
        toast.success('وظیفه حذف شد', { id: tid })
        refetchTasks()
      } else {
        await visitService.remove(deleteTarget.ref.id)
        toast.success('بازدید حذف شد', { id: tid })
        refetchVisits()
      }
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err.message || 'خطا در حذف', { id: tid })
    } finally {
      setDeleting(false)
    }
  }

  // ناوبری تقویم
  const { onNavigate, onView } = useMemo(
    () => ({
      onNavigate: (newDate) => setDate(newDate),
      onView: (newView) => setView(newView),
    }),
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="تقویم"
        description="نمایش وظایف و بازدیدهای برنامه‌ریزی‌شده"
        icon={CalendarIcon}
      />

      {/* خلاصه راهنما */}
      <ScrollAnimate type="fade-up" delay={0}>
<div
        className="flex flex-wrap items-center gap-3 text-xs text-content-muted"
      >
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: TASK_COLOR }}
            aria-hidden="true"
          />
          وظیفه
          <span className="font-semibold text-content mx-1">
            {Number(events.filter((e) => e.type === 'task').length).toLocaleString('fa-IR')}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: VISIT_COLOR }}
            aria-hidden="true"
          />
          بازدید
          <span className="font-semibold text-content mx-1">
            {Number(events.filter((e) => e.type === 'visit').length).toLocaleString('fa-IR')}
          </span>
        </span>
        {!readOnly && (
          <span className="text-content-muted">
            • برای افزودن رویداد روی روز دلخواه کلیک کنید
          </span>
        )}
        {readOnly && (
          <span className="text-content-muted">• حالت فقط‌خواندنی</span>
        )}
      </div>
</ScrollAnimate>

      {/* تقویم */}
      <ScrollAnimate type="fade-up" delay={100}>
<div
        dir="rtl"
        className="surface-card p-3 sm:p-4"
      >
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
              <CalendarIcon className="w-8 h-8 animate-pulse text-gold-600" />
              <p className="text-sm text-content-muted">در حال بارگذاری تقویم…</p>
            </div>
          </div>
        ) : (
          <>
            {/* استایل‌های اختصاصی برای تطبیق تقویم با تم طلایی و RTL */}
            <style>{`
              .rbc-calendar.rbc-rtl { direction: rtl; }
              .crm-calendar .rbc-toolbar {
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-bottom: 1rem;
              }
              .crm-calendar .rbc-toolbar button {
                color: var(--color-text-primary);
                background-color: var(--color-surface);
                border: 1px solid var(--color-border);
                border-radius: 0.5rem;
                padding: 0.375rem 0.75rem;
                font-size: 0.8rem;
                transition: all 0.15s ease;
              }
              .crm-calendar .rbc-toolbar button:hover {
                background-color: var(--color-surface-muted);
              }
              .crm-calendar .rbc-toolbar button.rbc-active {
                background-color: #D4A017;
                color: #fff;
                border-color: #D4A017;
                box-shadow: 0 1px 2px rgba(0,0,0,0.08);
              }
              .crm-calendar .rbc-toolbar button.rbc-active:hover {
                background-color: #B8860B;
              }
              .crm-calendar .rbc-month-view,
              .crm-calendar .rbc-time-view,
              .crm-calendar .rbc-agenda-view {
                border-radius: 0.75rem;
                overflow: hidden;
                border-color: var(--color-border);
              }
              .crm-calendar .rbc-header {
                padding: 0.5rem 0.25rem;
                font-weight: 600;
                color: var(--color-text-secondary);
                background-color: var(--color-surface-muted);
                border-color: var(--color-border) !important;
              }
              .crm-calendar .rbc-month-row + .rbc-month-row {
                border-color: var(--color-border) !important;
              }
              .crm-calendar .rbc-day-bg + .rbc-day-bg {
                border-color: var(--color-border) !important;
              }
              .crm-calendar .rbc-off-range-bg {
                background-color: var(--color-surface-muted);
                opacity: 0.5;
              }
              .crm-calendar .rbc-today {
                background-color: rgba(212, 160, 23, 0.10);
              }
              .crm-calendar .rbc-event {
                background-color: var(--color-surface-muted);
                border: none;
                border-radius: 0.375rem;
                padding: 0.125rem 0.25rem;
                font-size: 0.7rem;
                border-inline-start: 3px solid currentColor;
              }
              .crm-calendar .rbc-event:focus {
                outline: 2px solid #D4A017;
                outline-offset: 1px;
              }
              .crm-calendar .rbc-show-more {
                color: #D4A017;
                font-weight: 600;
                background-color: transparent;
              }
              .crm-calendar .rbc-show-more:hover {
                background-color: rgba(212, 160, 23, 0.10);
              }
              .crm-calendar .rbc-time-header-content,
              .crm-calendar .rbc-time-content,
              .crm-calendar .rbc-timeslot-group,
              .crm-calendar .rbc-time-slot {
                border-color: var(--color-border) !important;
              }
              .crm-calendar .rbc-current-time-indicator {
                background-color: #D4A017;
              }
              .crm-calendar .rbc-agenda-view table.rbc-agenda-table {
                border-color: var(--color-border);
              }
              .crm-calendar .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
                border-color: var(--color-border);
                padding: 0.5rem 0.75rem;
              }
              .crm-calendar .rbc-agenda-view table.rbc-agenda-table thead > tr > th {
                border-color: var(--color-border);
                padding: 0.5rem 0.75rem;
              }
            `}</style>

            <BigCalendar
              className="crm-calendar"
              rtl
              localizer={localizer}
              culture="fa-IR"
              events={events}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              tooltipAccessor="title"
              views={['month', 'week', 'day']}
              view={view}
              onView={onView}
              date={date}
              onNavigate={onNavigate}
              messages={messages}
              formats={formats}
              popup
              selectable={!readOnly}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              components={{
                event: CustomEvent,
              }}
              style={{ height: '70vh', minHeight: '500px' }}
              eventPropGetter={(event) => ({
                style: {
                  color: event.color || TASK_COLOR,
                },
              })}
            />
          </>
        )}
      </div>
</ScrollAnimate>

      {/* مودال انتخاب نوع رویداد هنگام کلیک روی slot */}
      <Modal
        open={!!slotInfo}
        onClose={() => setSlotInfo(null)}
        size="sm"
        title="افزودن رویداد"
        description={
          slotInfo
            ? `تاریخ انتخاب‌شده: ${toJalaliDateTime(slotInfo.start.toISOString())}`
            : ''
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <button
            type="button"
            onClick={handleAddTaskFromSlot}
            className="press-effect cursor-pointer flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-border bg-surface hover:border-gold-500 hover:bg-gold-50 dark:hover:bg-gold-900/15 transition-colors text-center"
          >
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: TASK_COLOR }}
            >
              <CheckSquare className="w-5 h-5" />
            </span>
            <span className="text-sm font-semibold text-content">افزودن وظیفه</span>
            <span className="text-xs text-content-muted">برای پیگیری کارها</span>
          </button>
          <button
            type="button"
            onClick={handleAddVisitFromSlot}
            className="press-effect cursor-pointer flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-border bg-surface hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/15 transition-colors text-center"
          >
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: VISIT_COLOR }}
            >
              <Building2 className="w-5 h-5" />
            </span>
            <span className="text-sm font-semibold text-content">افزودن بازدید</span>
            <span className="text-xs text-content-muted">برای بازدید ملک</span>
          </button>
        </div>
      </Modal>

      {/* مودال جزئیات رویداد */}
      <Modal
        open={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        size="md"
        title={detailEvent?.type === 'task' ? 'جزئیات وظیفه' : 'جزئیات بازدید'}
        description={detailEvent?.title}
        footer={
          <div className="flex items-center justify-between gap-2 w-full">
            <Badge color={detailEvent?.type === 'task' ? 'gold' : 'info'} dot>
              {detailEvent?.type === 'task' ? 'وظیفه' : 'بازدید'}
            </Badge>
            <div className="flex items-center gap-2">
              {!readOnly && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Pencil className="w-4 h-4" />}
                    onClick={handleEditFromDetail}
                  >
                    ویرایش
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    onClick={handleDeleteFromDetail}
                  >
                    حذف
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => setDetailEvent(null)}>
                بستن
              </Button>
            </div>
          </div>
        }
      >
        {detailEvent?.type === 'task' ? (
          <TaskDetail event={detailEvent} customerMap={customerMap} propertyMap={propertyMap} />
        ) : detailEvent?.type === 'visit' ? (
          <VisitDetail event={detailEvent} customerMap={customerMap} propertyMap={propertyMap} />
        ) : null}
      </Modal>

      {/* فرم وظیفه */}
      <TaskForm
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        task={editingTask}
        defaultDueDate={taskPrefillDate || undefined}
        onSubmitSuccess={refetchTasks}
      />

      {/* فرم بازدید */}
      <VisitForm
        open={visitFormOpen}
        onClose={() => setVisitFormOpen(false)}
        visit={editingVisit}
        defaultDate={visitPrefillDate || undefined}
        onSubmitSuccess={refetchVisits}
      />

      {/* تأیید حذف */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === 'task' ? 'حذف وظیفه' : 'حذف بازدید'}
        message={
          deleteTarget?.type === 'task'
            ? `آیا از حذف وظیفه «${deleteTarget?.ref?.title || ''}» مطمئن هستید؟`
            : `آیا از حذف این بازدید مطمئن هستید؟`
        }
        confirmText="حذف"
        loading={deleting}
      />

      {/* حالت خطای کلی (اگر هر دو سرویس شکست خوردند) */}
      {!loading && events.length === 0 && !tasksRaw && !visitsRaw ? (
        <ScrollAnimate type="fade" delay={0}>
<div className="surface-card">
          <EmptyState
            icon={AlertCircle}
            title="در حال حاضر رویدادی وجود ندارد"
            description="با کلیک روی روزهای تقویم می‌توانید وظیفه یا بازدید جدید ثبت کنید"
          />
        </div>
</ScrollAnimate>
      ) : null}
    </div>
  )
}

// ----------------------------------------------------
// جزئیات وظیفه در مودال
// ----------------------------------------------------
function TaskDetail({ event, customerMap, propertyMap }) {
  const t = event.ref
  const priority = TASK_PRIORITY.find((p) => p.value === t.priority)
  const status = TASK_STATUS.find((s) => s.value === t.status)
  return (
    <div className="divide-y divide-border">
      <DetailRow
        icon={Clock}
        label="تاریخ و ساعت سررسید"
        value={toJalaliDateTime(t.dueDate)}
      />
      <DetailRow icon={CheckSquare} label="عنوان" value={t.title} />
      {t.description && (
        <DetailRow icon={Eye} label="توضیحات" value={t.description} />
      )}
      {t.customerId && (
        <DetailRow
          icon={UserIcon}
          label="مشتری"
          value={customerMap[t.customerId]?.name || '—'}
        />
      )}
      {t.propertyId && (
        <DetailRow
          icon={Building2}
          label="ملک"
          value={propertyMap[t.propertyId]?.code || '—'}
        />
      )}
      <div className="flex items-center gap-3 py-3">
        <div className="shrink-0 p-1.5 rounded-lg bg-surface-muted text-content-muted">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          {priority && (
            <Badge color={getColor(TASK_PRIORITY, t.priority, 'gray')} dot>
              اولویت: {priority.label}
            </Badge>
          )}
          {status && (
            <Badge color={getColor(TASK_STATUS, t.status, 'gray')} dot>
              وضعیت: {status.label}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------
// جزئیات بازدید در مودال
// ----------------------------------------------------
function VisitDetail({ event, customerMap, propertyMap }) {
  const v = event.ref
  const status = VISIT_STATUS.find((s) => s.value === v.status)
  const result = VISIT_RESULTS.find((r) => r.value === v.result)
  return (
    <div className="divide-y divide-border">
      <DetailRow icon={Clock} label="تاریخ و ساعت بازدید" value={toJalaliDateTime(v.date)} />
      <DetailRow
        icon={UserIcon}
        label="مشتری"
        value={customerMap[v.customerId]?.name || '—'}
      />
      <DetailRow
        icon={Building2}
        label="ملک"
        value={
          propertyMap[v.propertyId]
            ? `${propertyMap[v.propertyId].code || ''} — ${propertyMap[v.propertyId].address || ''}`
            : '—'
        }
      />
      {v.notes && <DetailRow icon={Eye} label="یادداشت" value={v.notes} />}
      <div className="flex items-center gap-3 py-3">
        <div className="shrink-0 p-1.5 rounded-lg bg-surface-muted text-content-muted">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          {status && (
            <Badge color={getColor(VISIT_STATUS, v.status, 'gray')} dot>
              وضعیت: {status.label}
            </Badge>
          )}
          {result && <Badge color="info">نتیجه: {result.label}</Badge>}
          {!result && <span className="text-xs text-content-muted">بدون نتیجه ثبت‌شده</span>}
        </div>
      </div>
    </div>
  )
}
