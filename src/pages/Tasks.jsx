// Tasks — صفحه مدیریت وظایف با فیلتر، جدول sortable، دکمه انجام شد، export CSV و pagination
import ScrollAnimate from "../components/common/ScrollAnimate.jsx";
import React, { useState, useEffect, useMemo } from "react";
import {
  CheckSquare,
  Plus,
  Pencil,
  Trash2,
  Download,
  AlertCircle,
  Inbox,
  CheckCircle2,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { taskService } from "../services/taskService.js";
import { customerService } from "../services/customerService.js";
import { propertyService } from "../services/propertyService.js";
import { authService } from "../services/authService.js";
import { reportService } from "../services/reportService.js";
import PageHeader from "../components/common/PageHeader.jsx";
import Button from "../components/common/Button.jsx";
import FilterBar, { FilterItem } from "../components/common/FilterBar.jsx";
import Select from "../components/common/Select.jsx";
import Table from "../components/common/Table.jsx";
import Badge from "../components/common/Badge.jsx";
import Pagination from "../components/common/Pagination.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import { Skeleton } from "../components/common/LoadingSpinner.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import TaskForm from "../components/tasks/TaskForm.jsx";
import { TASK_PRIORITY, TASK_STATUS, DATE_RANGES } from "../utils/constants.js";
import { toJalali, toJalaliDateTime } from "../utils/formatters.js";
import { getLabel, getColor, filterByDateRange } from "../utils/helpers.js";
import { downloadCSV } from "../utils/exportCSV.js";

const PAGE_SIZE = 10;
const fa = (n) => Number(n || 0).toLocaleString("fa-IR");

export default function Tasks() {
  const { user, canWrite, hasRole } = useAuth();
  const isAdmin = hasRole(["admin"]);
  const isAssistant = user?.role === "assistant";
  const seesAll = isAdmin || isAssistant;

  const {
    data: tasksRaw,
    loading,
    error,
    refetch,
  } = useApi(() => taskService.getAll({ _limit: 1000 }), []);

  const { data: users } = useApi(() => authService.getAll(), []);
  const { data: customers } = useApi(
    () => customerService.getAll({ _limit: 1000 }),
    [],
  );
  const { data: properties } = useApi(
    () => propertyService.getAll({ _limit: 1000 }),
    [],
  );

  // فیلترها
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAdvisor, setFilterAdvisor] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  const [page, setPage] = useState(1);

  // مودال‌ها
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  // نقشه‌ها
  const userMap = useMemo(() => {
    const m = {};
    (users || []).forEach((u) => {
      m[u.id] = u;
    });
    return m;
  }, [users]);

  const customerMap = useMemo(() => {
    const m = {};
    (customers || []).forEach((c) => {
      m[c.id] = c;
    });
    return m;
  }, [customers]);

  const propertyMap = useMemo(() => {
    const m = {};
    (properties || []).forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [properties]);

  const filtered = useMemo(() => {
    if (!tasksRaw) return [];
    let list = tasksRaw;

    if (!seesAll) {
      list = list.filter((t) => t.assignedTo === user?.id);
    }

    if (filterStatus) list = list.filter((t) => t.status === filterStatus);
    if (filterPriority)
      list = list.filter((t) => t.priority === filterPriority);
    if (filterAdvisor)
      list = list.filter((t) => String(t.assignedTo) === filterAdvisor);

    list = filterByDateRange(list, "dueDate", filterDate);
    return list;
  }, [
    tasksRaw,
    seesAll,
    user,
    filterStatus,
    filterPriority,
    filterAdvisor,
    filterDate,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterPriority, filterAdvisor, filterDate]);

  const hasActiveFilters =
    filterStatus || filterPriority || filterAdvisor || filterDate !== "all";

  const handleResetFilters = () => {
    setFilterStatus("");
    setFilterPriority("");
    setFilterAdvisor("");
    setFilterDate("all");
  };

  const handleAdd = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  // علامت‌گذاری وظیفه به‌عنوان انجام شده
  const handleMarkDone = async (task) => {
    setMarkingId(task.id);
    const tid = toast.loading("در حال ثبت…");
    try {
      await taskService.update(task.id, { status: "done" });
      toast.success("وظیفه انجام شد", { id: tid });
      try {
        await reportService.createActivity({
          userId: user?.id,
          action: "completed_task",
          description: `وظیفه «${task.title}» انجام شد`,
          entityType: "task",
          entityId: task.id,
          createdAt: new Date().toISOString(),
        });
      } catch {
        /* غیربحرانی */
      }
      refetch();
    } catch (err) {
      toast.error(err.message || "خطا در به‌روزرسانی", { id: tid });
    } finally {
      setMarkingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const tid = toast.loading("در حال حذف…");
    try {
      await taskService.remove(deleteTarget.id);
      toast.success("وظیفه حذف شد", { id: tid });
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message || "خطا در حذف وظیفه", { id: tid });
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const rows = filtered.map((t) => ({
      title: t.title || "",
      description: t.description || "",
      customer: customerMap[t.customerId]?.name || "",
      property: propertyMap[t.propertyId]?.code || "",
      dueDate: toJalaliDateTime(t.dueDate),
      priority: getLabel(TASK_PRIORITY, t.priority),
      status: getLabel(TASK_STATUS, t.status),
      advisor: userMap[t.assignedTo]?.name || "",
    }));
    const columns = [
      { key: "title", label: "عنوان" },
      { key: "description", label: "توضیحات" },
      { key: "customer", label: "مشتری" },
      { key: "property", label: "ملک" },
      { key: "dueDate", label: "سررسید" },
      { key: "priority", label: "اولویت" },
      { key: "status", label: "وضعیت" },
      { key: "advisor", label: "مشاور" },
    ];
    downloadCSV(rows, columns, `tasks-${Date.now()}.csv`);
    toast.success("فایل CSV دانلود شد");
  };

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: "عنوان",
        render: (row) => (
          <div className="flex items-start gap-2 max-w-xs">
            <div
              className={`shrink-0 p-1 rounded-md ${row.status === "done" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-surface-muted text-content-muted"}`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p
                className={`font-medium text-content truncate ${row.status === "done" ? "line-through text-content-muted" : ""}`}
              >
                {row.title}
              </p>
              {row.description && (
                <p className="text-xs text-content-muted truncate mt-0.5">
                  {row.description}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "customerId",
        header: "مشتری",
        sortable: false,
        render: (row) => (
          <span className="text-content-muted text-sm">
            {row.customerId ? customerMap[row.customerId]?.name || "—" : "—"}
          </span>
        ),
      },
      {
        key: "propertyId",
        header: "ملک",
        sortable: false,
        render: (row) => (
          <span className="font-mono text-xs text-content-muted">
            {row.propertyId ? propertyMap[row.propertyId]?.code || "—" : "—"}
          </span>
        ),
      },
      {
        key: "dueDate",
        header: "سررسید",
        render: (row) => (
          <div className="flex items-center gap-1.5 text-xs text-content-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>{toJalaliDateTime(row.dueDate)}</span>
          </div>
        ),
      },
      {
        key: "priority",
        header: "اولویت",
        render: (row) => (
          <Badge color={getColor(TASK_PRIORITY, row.priority, "gray")} dot>
            {getLabel(TASK_PRIORITY, row.priority)}
          </Badge>
        ),
      },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => (
          <Badge color={getColor(TASK_STATUS, row.status, "gray")} dot>
            {getLabel(TASK_STATUS, row.status)}
          </Badge>
        ),
      },
      {
        key: "assignedTo",
        header: "مشاور",
        sortable: false,
        render: (row) => (
          <span className="text-content-muted text-sm">
            {userMap[row.assignedTo]?.name || "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "عملیات",
        sortable: false,
        className: "text-left",
        render: (row) => (
          <div className="flex items-center justify-end gap-1">
            {row.status !== "done" && canWrite() && (
              <button
                type="button"
                onClick={() => handleMarkDone(row)}
                disabled={markingId === row.id}
                className="press-effect p-1.5 rounded-lg text-content-muted hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="انجام شد"
                aria-label="انجام شد"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
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
    [customerMap, propertyMap, userMap, canWrite, markingId],
  );

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="وظایف" icon={CheckSquare} />
        <EmptyState
          icon={AlertCircle}
          title="خطا در بارگذاری"
          description={error}
          action={<Button onClick={refetch}>تلاش مجدد</Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="وظایف"
        description={
          seesAll ? "مدیریت وظایف و پیگیری‌ها" : "وظایف محول شده به شما"
        }
        icon={CheckSquare}
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
                افزودن وظیفه
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
            title="فیلترهای وظایف"
          >
            <FilterItem label="وضعیت">
              <Select
                options={TASK_STATUS.map((s) => ({
                  value: s.value,
                  label: s.label,
                }))}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                placeholder="همه وضعیت‌ها"
              />
            </FilterItem>
            <FilterItem label="اولویت">
              <Select
                options={TASK_PRIORITY.map((p) => ({
                  value: p.value,
                  label: p.label,
                }))}
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                placeholder="همه اولویت‌ها"
              />
            </FilterItem>
            {isAdmin && (
              <FilterItem label="مشاور">
                <Select
                  options={(users || [])
                    .filter((u) => u.role === "advisor")
                    .map((u) => ({ value: String(u.id), label: u.name }))}
                  value={filterAdvisor}
                  onChange={(e) => setFilterAdvisor(e.target.value)}
                  placeholder="همه مشاوران"
                />
              </FilterItem>
            )}
            <FilterItem label="بازه زمانی سررسید">
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
            مجموع:{" "}
            <span className="font-semibold text-content">
              {fa(filtered.length)}
            </span>{" "}
            وظیفه
            {filtered.length > 0 && (
              <span className="mr-3">
                • باز:{" "}
                <span className="font-semibold text-gold-700 dark:text-gold-400">
                  {fa(filtered.filter((t) => t.status !== "done").length)}
                </span>
              </span>
            )}
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
              title="وظیفه‌ای یافت نشد"
              description={
                hasActiveFilters
                  ? "فیلترها را تغییر دهید یا پاک کنید"
                  : "هنوز وظیفه‌ای ثبت نشده است"
              }
              action={
                canWrite() && !hasActiveFilters ? (
                  <Button
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={handleAdd}
                  >
                    افزودن اولین وظیفه
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
              initialSort={{ field: "dueDate", direction: "asc" }}
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
      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        task={editingTask}
        onSubmitSuccess={refetch}
      />

      {/* تأیید حذف */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف وظیفه"
        message={`آیا از حذف وظیفه «${deleteTarget?.title || ""}» مطمئن هستید؟`}
        confirmText="حذف"
        loading={deleting}
      />
    </div>
  );
}
