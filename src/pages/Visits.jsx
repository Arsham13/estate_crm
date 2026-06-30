// Visits — صفحه مدیریت بازدیدها با فیلتر، جدول sortable، export CSV و pagination
import ScrollAnimate from "../components/common/ScrollAnimate.jsx";
import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarCheck,
  Plus,
  Pencil,
  Trash2,
  Download,
  AlertCircle,
  Inbox,
  Clock,
  User,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { visitService } from "../services/visitService.js";
import { customerService } from "../services/customerService.js";
import { propertyService } from "../services/propertyService.js";
import { authService } from "../services/authService.js";
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
import VisitForm from "../components/visits/VisitForm.jsx";
import {
  VISIT_STATUS,
  VISIT_RESULTS,
  DATE_RANGES,
} from "../utils/constants.js";
import { toJalaliDateTime } from "../utils/formatters.js";
import { getLabel, getColor, filterByDateRange } from "../utils/helpers.js";
import { downloadCSV } from "../utils/exportCSV.js";

const PAGE_SIZE = 10;
const fa = (n) => Number(n || 0).toLocaleString("fa-IR");

// رنگ بج برای نتیجه بازدید
const RESULT_COLOR = {
  interested: "success",
  not_interested: "error",
  thinking: "warning",
};

export default function Visits() {
  const { user, canWrite, hasRole } = useAuth();
  const isAdmin = hasRole(["admin"]);
  const isAssistant = user?.role === "assistant";
  const seesAll = isAdmin || isAssistant;

  const {
    data: visitsRaw,
    loading,
    error,
    refetch,
  } = useApi(() => visitService.getAll({ _limit: 1000 }), []);

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
  const [filterResult, setFilterResult] = useState("");
  const [filterAdvisor, setFilterAdvisor] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  const [page, setPage] = useState(1);

  // مودال‌ها
  const [formOpen, setFormOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    if (!visitsRaw) return [];
    let list = visitsRaw;

    if (!seesAll) {
      list = list.filter((v) => v.advisorId === user?.id);
    }

    if (filterStatus) list = list.filter((v) => v.status === filterStatus);
    if (filterResult) list = list.filter((v) => v.result === filterResult);
    if (filterAdvisor)
      list = list.filter((v) => String(v.advisorId) === filterAdvisor);

    list = filterByDateRange(list, "date", filterDate);
    return list;
  }, [
    visitsRaw,
    seesAll,
    user,
    filterStatus,
    filterResult,
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
  }, [filterStatus, filterResult, filterAdvisor, filterDate]);

  const hasActiveFilters =
    filterStatus || filterResult || filterAdvisor || filterDate !== "all";

  const handleResetFilters = () => {
    setFilterStatus("");
    setFilterResult("");
    setFilterAdvisor("");
    setFilterDate("all");
  };

  const handleAdd = () => {
    setEditingVisit(null);
    setFormOpen(true);
  };

  const handleEdit = (visit) => {
    setEditingVisit(visit);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const tid = toast.loading("در حال حذف…");
    try {
      await visitService.remove(deleteTarget.id);
      toast.success("بازدید حذف شد", { id: tid });
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message || "خطا در حذف بازدید", { id: tid });
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const rows = filtered.map((v) => ({
      customer: customerMap[v.customerId]?.name || "",
      property: propertyMap[v.propertyId]?.code || "",
      advisor: userMap[v.advisorId]?.name || "",
      date: toJalaliDateTime(v.date),
      status: getLabel(VISIT_STATUS, v.status),
      result: v.result ? getLabel(VISIT_RESULTS, v.result) : "",
      notes: v.notes || "",
    }));
    const columns = [
      { key: "customer", label: "مشتری" },
      { key: "property", label: "ملک" },
      { key: "advisor", label: "مشاور" },
      { key: "date", label: "تاریخ" },
      { key: "status", label: "وضعیت" },
      { key: "result", label: "نتیجه" },
      { key: "notes", label: "یادداشت" },
    ];
    downloadCSV(rows, columns, `visits-${Date.now()}.csv`);
    toast.success("فایل CSV دانلود شد");
  };

  const columns = useMemo(
    () => [
      {
        key: "customerId",
        header: "مشتری",
        sortable: false,
        render: (row) => (
          <div className="flex items-center gap-2">
            <div className="shrink-0 w-7 h-7 rounded-full bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-300 flex items-center justify-center text-[10px] font-bold">
              {(customerMap[row.customerId]?.name || "؟").slice(0, 1)}
            </div>
            <span className="text-content font-medium">
              {customerMap[row.customerId]?.name || "—"}
            </span>
          </div>
        ),
      },
      {
        key: "propertyId",
        header: "ملک",
        sortable: false,
        render: (row) => (
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-content-muted" />
            <span className="font-mono text-xs text-content-muted">
              {propertyMap[row.propertyId]?.code || "—"}
            </span>
          </div>
        ),
      },
      {
        key: "advisorId",
        header: "مشاور",
        sortable: false,
        render: (row) => (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-content-muted" />
            <span className="text-content-muted text-sm">
              {userMap[row.advisorId]?.name || "—"}
            </span>
          </div>
        ),
      },
      {
        key: "date",
        header: "تاریخ بازدید",
        render: (row) => (
          <div className="flex items-center gap-1.5 text-xs text-content">
            <Clock className="w-3.5 h-3.5 text-content-muted" />
            <span>{toJalaliDateTime(row.date)}</span>
          </div>
        ),
      },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => (
          <Badge color={getColor(VISIT_STATUS, row.status, "gray")} dot>
            {getLabel(VISIT_STATUS, row.status)}
          </Badge>
        ),
      },
      {
        key: "result",
        header: "نتیجه",
        sortable: false,
        render: (row) =>
          row.result ? (
            <Badge color={RESULT_COLOR[row.result] || "gray"}>
              {getLabel(VISIT_RESULTS, row.result)}
            </Badge>
          ) : (
            <span className="text-content-muted text-sm">—</span>
          ),
      },
      {
        key: "actions",
        header: "عملیات",
        sortable: false,
        className: "text-left",
        render: (row) => (
          <div className="flex items-center justify-end gap-1">
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
    [customerMap, propertyMap, userMap, canWrite],
  );

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="بازدیدها" icon={CalendarCheck} />
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
        title="بازدیدها"
        description={
          seesAll ? "مدیریت بازدیدهای ملک‌ها" : "بازدیدهای اختصاص‌یافته به شما"
        }
        icon={CalendarCheck}
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
                افزودن بازدید
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
            title="فیلترهای بازدیدها"
          >
            <FilterItem label="وضعیت">
              <Select
                options={VISIT_STATUS.map((s) => ({
                  value: s.value,
                  label: s.label,
                }))}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                placeholder="همه وضعیت‌ها"
              />
            </FilterItem>
            <FilterItem label="نتیجه">
              <Select
                options={VISIT_RESULTS.map((r) => ({
                  value: r.value,
                  label: r.label,
                }))}
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
                placeholder="همه نتایج"
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
            مجموع:{" "}
            <span className="font-semibold text-content">
              {fa(filtered.length)}
            </span>{" "}
            بازدید
            {filtered.length > 0 && (
              <span className="mr-3">
                • برنامه‌ریزی شده:{" "}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {fa(filtered.filter((v) => v.status === "scheduled").length)}
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
              title="بازدیدی یافت نشد"
              description={
                hasActiveFilters
                  ? "فیلترها را تغییر دهید یا پاک کنید"
                  : "هنوز بازدیدی ثبت نشده است"
              }
              action={
                canWrite() && !hasActiveFilters ? (
                  <Button
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={handleAdd}
                  >
                    افزودن اولین بازدید
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
              initialSort={{ field: "date", direction: "desc" }}
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
      <VisitForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        visit={editingVisit}
        onSubmitSuccess={refetch}
      />

      {/* تأیید حذف */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف بازدید"
        message={`آیا از حذف این بازدید مطمئن هستید؟ این عملیات قابل بازگشت نیست.`}
        confirmText="حذف"
        loading={deleting}
      />
    </div>
  );
}
