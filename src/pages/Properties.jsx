// Properties — صفحه مدیریت ملک‌ها با نمای لیست/گرید، جستجو، فیلتر، pagination و خروجی CSV
import ScrollAnimate from "../components/common/ScrollAnimate.jsx";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Building2,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Download,
  List as ListIcon,
  LayoutGrid,
  AlertCircle,
  Inbox,
  MapPin,
  Maximize,
  BedDouble,
  Layers,
  Calendar,
  Car,
  Warehouse,
  ArrowUpCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { propertyService } from "../services/propertyService.js";
import { visitService } from "../services/visitService.js";
import { authService } from "../services/authService.js";
import { reportService } from "../services/reportService.js";
import PageHeader from "../components/common/PageHeader.jsx";
import Button from "../components/common/Button.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import FilterBar, { FilterItem } from "../components/common/FilterBar.jsx";
import Select from "../components/common/Select.jsx";
import Table from "../components/common/Table.jsx";
import Badge from "../components/common/Badge.jsx";
import Card, { CardHeader } from "../components/common/Card.jsx";
import Pagination from "../components/common/Pagination.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import LoadingSpinner, {
  Skeleton,
} from "../components/common/LoadingSpinner.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import Modal from "../components/common/Modal.jsx";
import PropertyForm from "../components/properties/PropertyForm.jsx";
import PropertyCard from "../components/properties/PropertyCard.jsx";
import {
  PROPERTY_TYPES,
  DEAL_TYPES,
  PROPERTY_STATUS,
  DATE_RANGES,
} from "../utils/constants.js";
import {
  toJalali,
  toJalaliDateTime,
  formatCurrency,
  formatCompactCurrency,
  truncate,
} from "../utils/formatters.js";
import { getLabel, filterByDateRange } from "../utils/helpers.js";

const PAGE_SIZE = 10;
const fa = (n) => Number(n || 0).toLocaleString("fa-IR");

// رنگ نشان وضعیت ملک
const STATUS_COLOR = {
  available: "success",
  sold: "error",
  rented: "info",
};

export default function Properties() {
  const { user, canWrite, hasRole } = useAuth();
  const isAdmin = hasRole(["admin"]);
  const isAssistant = user?.role === "assistant";
  const seesAll = isAdmin || isAssistant;

  // واکشی اولیه
  const {
    data: propertiesRaw,
    loading,
    error,
    refetch,
  } = useApi(() => propertyService.getAll({ _limit: 1000 }), []);

  const { data: users } = useApi(() => authService.getAll(), []);

  // فیلترها
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDeal, setFilterDeal] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAdvisor, setFilterAdvisor] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("list"); // 'list' | 'grid'

  // مودال‌ها
  const [formOpen, setFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProperty, setDetailProperty] = useState(null);
  const [detailVisits, setDetailVisits] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      map[u.id] = u;
    });
    return map;
  }, [users]);

  // فیلتر داده‌ها
  const filtered = useMemo(() => {
    if (!propertiesRaw) return [];
    let list = propertiesRaw;

    if (!seesAll) {
      list = list.filter((p) => p.assignedTo === user?.id);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          (p.address && p.address.toLowerCase().includes(q)) ||
          (p.code && p.code.toLowerCase().includes(q)) ||
          (p.district && p.district.toLowerCase().includes(q)),
      );
    }

    if (filterType) list = list.filter((p) => p.type === filterType);
    if (filterDeal) list = list.filter((p) => p.dealType === filterDeal);
    if (filterStatus) list = list.filter((p) => p.status === filterStatus);
    if (filterAdvisor)
      list = list.filter((p) => String(p.assignedTo) === filterAdvisor);

    list = filterByDateRange(list, "createdAt", filterDate);
    return list;
  }, [
    propertiesRaw,
    seesAll,
    user,
    search,
    filterType,
    filterDeal,
    filterStatus,
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
  }, [
    search,
    filterType,
    filterDeal,
    filterStatus,
    filterAdvisor,
    filterDate,
    view,
  ]);

  const hasActiveFilters =
    search ||
    filterType ||
    filterDeal ||
    filterStatus ||
    filterAdvisor ||
    filterDate !== "all";

  const handleResetFilters = () => {
    setSearch("");
    setFilterType("");
    setFilterDeal("");
    setFilterStatus("");
    setFilterAdvisor("");
    setFilterDate("all");
  };

  const handleAdd = () => {
    setEditingProperty(null);
    setFormOpen(true);
  };

  const handleEdit = (property) => {
    setDetailOpen(false);
    setEditingProperty(property);
    setFormOpen(true);
  };

  // مشاهده جزئیات + افزایش شمارنده بازدید
  const handleView = useCallback(async (property) => {
    setDetailProperty(property);
    setDetailOpen(true);
    setDetailVisits([]);
    setDetailLoading(true);
    // افزایش شمارنده بازدید (non-blocking)
    try {
      await propertyService.incrementView(property.id, property.viewCount || 0);
      // آپدیت محلی بدون refetch کامل برای جلوگیری از پرش UI
    } catch {
      /* غیربحرانی */
    }
    // واکشی بازدیدهای مرتبط
    visitService
      .getAll({ propertyId: property.id, _limit: 100 })
      .then((v) => setDetailVisits(Array.isArray(v) ? v : []))
      .catch(() => setDetailVisits([]))
      .finally(() => setDetailLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const tid = toast.loading("در حال حذف…");
    try {
      await propertyService.remove(deleteTarget.id);
      toast.success("ملک حذف شد", { id: tid });
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message || "خطا در حذف ملک", { id: tid });
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const rows = filtered.map((p) => ({
      code: p.code,
      type: getLabel(PROPERTY_TYPES, p.type),
      dealType: getLabel(DEAL_TYPES, p.dealType),
      status: getLabel(PROPERTY_STATUS, p.status),
      address: p.address,
      area: p.area,
      rooms: p.rooms,
      floor: p.floor,
      yearBuilt: p.yearBuilt,
      price: p.price,
      advisor: userMap[p.assignedTo]?.name || "",
      viewCount: p.viewCount,
      createdAt: toJalali(p.createdAt),
    }));
    const columns = [
      { key: "code", label: "کد" },
      { key: "type", label: "نوع" },
      { key: "dealType", label: "نوع معامله" },
      { key: "status", label: "وضعیت" },
      { key: "address", label: "آدرس" },
      { key: "area", label: "متراژ" },
      { key: "rooms", label: "اتاق" },
      { key: "floor", label: "طبقه" },
      { key: "yearBuilt", label: "سال ساخت" },
      { key: "price", label: "قیمت" },
      { key: "advisor", label: "مشاور" },
      { key: "viewCount", label: "بازدید" },
      { key: "createdAt", label: "تاریخ ثبت" },
    ];
    downloadCSV(rows, columns, `properties-${Date.now()}.csv`);
    toast.success("فایل CSV دانلود شد");
  };

  // ستون‌های جدول
  const columns = useMemo(
    () => [
      {
        key: "code",
        header: "کد ملک",
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-gold-700 dark:text-gold-400">
            {row.code || "—"}
          </span>
        ),
      },
      {
        key: "type",
        header: "نوع",
        render: (row) => (
          <Badge color="gold">{getLabel(PROPERTY_TYPES, row.type)}</Badge>
        ),
      },
      {
        key: "address",
        header: "آدرس",
        render: (row) => (
          <span className="text-content-muted text-sm" title={row.address}>
            {truncate(row.address, 35)}
          </span>
        ),
      },
      {
        key: "area",
        header: "متراژ",
        render: (row) => (
          <span className="text-content">
            {row.area ? `${fa(row.area)} م²` : "—"}
          </span>
        ),
      },
      {
        key: "rooms",
        header: "اتاق",
        render: (row) => (
          <span className="text-content">
            {row.rooms != null ? fa(row.rooms) : "—"}
          </span>
        ),
      },
      {
        key: "price",
        header: "قیمت",
        render: (row) => (
          <span className="text-content font-medium">
            {row.price ? `${formatCompactCurrency(row.price)} ت` : "—"}
          </span>
        ),
      },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => (
          <Badge color={STATUS_COLOR[row.status] || "gray"}>
            {getLabel(PROPERTY_STATUS, row.status)}
          </Badge>
        ),
      },
      {
        key: "dealType",
        header: "معامله",
        render: (row) => (
          <Badge color="purple">{getLabel(DEAL_TYPES, row.dealType)}</Badge>
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
        key: "viewCount",
        header: "بازدید",
        render: (row) => (
          <span className="inline-flex items-center gap-1 text-content-muted text-sm">
            <Eye className="w-3.5 h-3.5" />
            {fa(row.viewCount || 0)}
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
    [userMap, canWrite, handleView],
  );

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="ملک‌ها" icon={Building2} />
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
        title="ملک‌ها"
        description={
          seesAll
            ? "مدیریت کامل املاک، فیلتر و جستجو"
            : "املاک اختصاص‌یافته به شما"
        }
        icon={Building2}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* سوییچ نما */}
            <div className="inline-flex items-center rounded-xl border border-border bg-surface p-0.5">
              <button
                type="button"
                onClick={() => setView("list")}
                className={`press-effect inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  view === "list"
                    ? "bg-gold-600 text-white"
                    : "text-content-muted hover:text-content"
                }`}
                title="نمای لیستی"
              >
                <ListIcon className="w-3.5 h-3.5" />
                لیست
              </button>
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`press-effect inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  view === "grid"
                    ? "bg-gold-600 text-white"
                    : "text-content-muted hover:text-content"
                }`}
                title="نمای گرید"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                گرید
              </button>
            </div>
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
                افزودن ملک
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
            placeholder="جستجو بر اساس آدرس، کد یا محله…"
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
            <FilterItem label="نوع ملک">
              <Select
                options={PROPERTY_TYPES}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                placeholder="همه انواع"
              />
            </FilterItem>
            <FilterItem label="نوع معامله">
              <Select
                options={DEAL_TYPES}
                value={filterDeal}
                onChange={(e) => setFilterDeal(e.target.value)}
                placeholder="همه"
              />
            </FilterItem>
            <FilterItem label="وضعیت">
              <Select
                options={PROPERTY_STATUS}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                placeholder="همه"
              />
            </FilterItem>
            {isAdmin ? (
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
            ) : (
              <FilterItem label="بازه زمانی">
                <Select
                  options={DATE_RANGES}
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  placeholder="همه"
                />
              </FilterItem>
            )}
          </FilterBar>
        </div>
      </ScrollAnimate>

      {/* خلاصه تعداد */}
      <ScrollAnimate type="fade-up" delay={200}>
        <div className="flex items-center justify-between text-sm text-content-muted">
          <span>
            مجموع:{" "}
            <span className="font-semibold text-content">
              {fa(filtered.length)}
            </span>{" "}
            ملک
          </span>
          {loading && <span className="text-xs">در حال بارگذاری…</span>}
        </div>
      </ScrollAnimate>

      {/* محتوا */}
      {loading ? (
        view === "list" ? (
          <div className="surface-card p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <ScrollAnimate type="fade" delay={0}>
          <div className="surface-card">
            <EmptyState
              icon={Inbox}
              title="ملکی یافت نشد"
              description={
                hasActiveFilters
                  ? "فیلترها را تغییر دهید یا پاک کنید"
                  : "هنوز ملکی ثبت نشده است"
              }
              action={
                canWrite() && !hasActiveFilters ? (
                  <Button
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={handleAdd}
                  >
                    افزودن اولین ملک
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
      ) : view === "list" ? (
        <ScrollAnimate type="fade-up" delay={300}>
          <div>
            <Table
              columns={columns}
              data={paged}
              initialSort={{ field: "createdAt", direction: "desc" }}
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
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map((p, i) => (
              <PropertyCard
                key={p.id}
                property={p}
                onClick={handleView}
                delay={Math.min(500, i * 100)}
              />
            ))}
          </div>
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={setPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </>
      )}

      {/* مودال فرم */}
      <PropertyForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        property={editingProperty}
        onSubmitSuccess={refetch}
      />

      {/* مودال جزئیات */}
      <PropertyDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        property={detailProperty}
        advisor={detailProperty ? userMap[detailProperty.assignedTo] : null}
        visits={detailVisits}
        visitsLoading={detailLoading}
        onEdit={canWrite() ? handleEdit : undefined}
      />

      {/* تأیید حذف */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف ملک"
        message={`آیا از حذف ملک «${deleteTarget?.code || ""}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`}
        confirmText="حذف"
        loading={deleting}
      />
    </div>
  );
}

// ============================================================
// PropertyDetailModal — مودال نمایش جزئیات ملک + بازدیدهای مرتبط
// (در همان فایل برای جلوگیری از اسکوپ اضافی)
// ============================================================
function PropertyDetailModal({
  open,
  onClose,
  property,
  advisor,
  visits = [],
  visitsLoading = false,
  onEdit,
}) {
  if (!property) return null;

  const features = [
    property.hasParking && { icon: Car, label: "پارکینگ" },
    property.hasStorage && { icon: Warehouse, label: "انباری" },
    property.hasElevator && { icon: ArrowUpCircle, label: "آسانسور" },
  ].filter(Boolean);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={property.code || "جزئیات ملک"}
      description={getLabel(PROPERTY_TYPES, property.type)}
      footer={
        onEdit ? (
          <Button
            size="sm"
            leftIcon={<Pencil className="w-4 h-4" />}
            onClick={() => onEdit(property)}
          >
            ویرایش ملک
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {/* بج‌ها */}
        <ScrollAnimate type="fade" delay={0}>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge color="gold">
              {getLabel(PROPERTY_TYPES, property.type)}
            </Badge>
            <Badge color="purple">
              {getLabel(DEAL_TYPES, property.dealType)}
            </Badge>
            <Badge color={STATUS_COLOR[property.status] || "gray"}>
              {getLabel(PROPERTY_STATUS, property.status)}
            </Badge>
            <Badge color="gray" dot>
              {fa(property.viewCount || 0)} بازدید
            </Badge>
          </div>
        </ScrollAnimate>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* اطلاعات اصلی */}
          <Card padding="p-5" animate="fade-up" animateDelay={100}>
            <CardHeader
              title="اطلاعات ملک"
              icon={<Building2 className="w-5 h-5" />}
            />
            <div className="divide-y divide-border">
              <DetailRow icon={MapPin} label="آدرس" value={property.address} />
              <DetailRow
                icon={Maximize}
                label="متراژ"
                value={property.area ? `${fa(property.area)} متر مربع` : "—"}
              />
              <DetailRow
                icon={BedDouble}
                label="تعداد اتاق"
                value={property.rooms != null ? fa(property.rooms) : "—"}
              />
              <DetailRow
                icon={Layers}
                label="طبقه"
                value={property.floor != null ? fa(property.floor) : "—"}
              />
              <DetailRow
                icon={Calendar}
                label="سال ساخت"
                value={property.yearBuilt ? fa(property.yearBuilt) : "—"}
              />
              <DetailRow
                icon={Building2}
                label="مشاور مسئول"
                value={advisor?.name || "—"}
              />
              <DetailRow
                icon={Calendar}
                label="تاریخ ثبت"
                value={toJalaliDateTime(property.createdAt)}
              />
            </div>

            {/* قیمت */}
            <div className="mt-4 p-3 rounded-xl bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-800">
              <p className="text-xs text-content-muted">قیمت</p>
              <p className="text-xl font-bold text-gold-700 dark:text-gold-400">
                {property.price ? `${formatCurrency(property.price)} ت` : "—"}
              </p>
            </div>
          </Card>

          {/* امکانات + توضیحات + بازدیدها */}
          <div className="space-y-5">
            <Card padding="p-5" animate="fade-up" animateDelay={200}>
              <CardHeader title="امکانات" icon={<Car className="w-5 h-5" />} />
              {features.length > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {features.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-muted text-sm text-content"
                    >
                      <f.icon className="w-4 h-4 text-gold-600" />
                      {f.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-content-muted italic">
                  امکانی ثبت نشده است
                </p>
              )}
            </Card>

            {property.description && (
              <Card padding="p-5" animate="fade-up" animateDelay={300}>
                <CardHeader title="توضیحات" />
                <p className="text-sm text-content leading-7 whitespace-pre-wrap bg-surface-muted/50 rounded-xl p-3">
                  {property.description}
                </p>
              </Card>
            )}

            <Card padding="p-5" animate="fade-up" animateDelay={400}>
              <CardHeader
                title="بازدیدهای مرتبط"
                subtitle={`${fa(visits.length)} بازدید`}
                icon={<Eye className="w-5 h-5" />}
              />
              {visitsLoading ? (
                <LoadingSpinner size="sm" label="در حال بارگذاری…" />
              ) : visits.length === 0 ? (
                <p className="text-sm text-content-muted py-2 text-center">
                  بازدیدی برای این ملک ثبت نشده است
                </p>
              ) : (
                <ul className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {visits.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-muted/40 border border-border"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-content truncate">
                          {toJalaliDateTime(v.date)}
                        </p>
                        <p className="text-xs text-content-muted mt-0.5">
                          {v.status === "done"
                            ? "انجام شده"
                            : v.status === "canceled"
                              ? "لغو شده"
                              : "برنامه‌ریزی شده"}
                        </p>
                      </div>
                      {v.result && (
                        <Badge color="info" size="sm">
                          {v.result === "interested"
                            ? "علاقه‌مند"
                            : v.result === "not_interested"
                              ? "علاقه‌مند نیست"
                              : "در حال فکر"}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="shrink-0 p-1.5 rounded-lg bg-surface-muted text-content-muted">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-content-muted">{label}</p>
        <p className="text-sm font-medium text-content break-words">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
