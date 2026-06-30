// Pipeline — صفحه کانبان پایپ‌لاین فروش با drag & drop
import ScrollAnimate from "../components/common/ScrollAnimate.jsx";
import React, { useState, useMemo } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import {
  TrendingUp,
  AlertCircle,
  Users as UsersIcon,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { customerService } from "../services/customerService.js";
import { authService } from "../services/authService.js";
import { reportService } from "../services/reportService.js";
import PageHeader from "../components/common/PageHeader.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import FilterBar, { FilterItem } from "../components/common/FilterBar.jsx";
import Select from "../components/common/Select.jsx";
import KanbanColumn from "../components/pipeline/KanbanColumn.jsx";
import CustomerProfile from "../components/customers/CustomerProfile.jsx";
import { PIPELINE_STAGES } from "../utils/constants.js";
import { getLabel } from "../utils/helpers.js";

const fa = (n) => Number(n || 0).toLocaleString("fa-IR");

export default function Pipeline() {
  const { user, canWrite, hasRole } = useAuth();
  const isAdmin = hasRole(["admin"]);
  const isAssistant = user?.role === "assistant";
  const seesAll = isAdmin || isAssistant;
  // دستیار فقط‌خواندنی → drag غیرفعال
  const dragDisabled = isAssistant;

  const {
    data: customersRaw,
    loading,
    error,
    refetch,
    setData,
  } = useApi(() => customerService.getAll({ _limit: 1000 }), []);

  const { data: users } = useApi(() => authService.getAll(), []);
  const { data: activities } = useApi(
    () =>
      reportService.getActivities({
        _limit: 1000,
        _sort: "createdAt",
        _order: "desc",
      }),
    [],
  );

  const [filterAdvisor, setFilterAdvisor] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileCustomer, setProfileCustomer] = useState(null);

  // نقشه کاربران
  const userMap = useMemo(() => {
    const m = {};
    (users || []).forEach((u) => {
      m[u.id] = u;
    });
    return m;
  }, [users]);

  // آخرین فعالیت هر مشتری (proxy: createdAt اگر فعالیتی نیست)
  const lastActivityByCustomer = useMemo(() => {
    const m = {};
    (activities || []).forEach((a) => {
      if (a.entityType !== "customer" || !a.entityId) return;
      const cur = m[a.entityId];
      if (!cur || new Date(a.createdAt) > new Date(cur)) {
        m[a.entityId] = a.createdAt;
      }
    });
    return m;
  }, [activities]);

  // لیست نهایی مشتریان با فیلتر نقش + فیلتر مشاور
  const customers = useMemo(() => {
    if (!customersRaw) return [];
    let list = customersRaw.map((c) => ({
      ...c,
      lastActivityAt: lastActivityByCustomer[c.id] || c.createdAt,
    }));
    if (!seesAll) list = list.filter((c) => c.assignedTo === user?.id);
    if (filterAdvisor)
      list = list.filter((c) => String(c.assignedTo) === filterAdvisor);
    return list;
  }, [customersRaw, seesAll, user, filterAdvisor, lastActivityByCustomer]);

  // گروه‌بندی بر اساس stage
  const grouped = useMemo(() => {
    const map = {};
    PIPELINE_STAGES.forEach((s) => {
      map[s.value] = [];
    });
    customers.forEach((c) => {
      const stage = c.pipelineStage || "new";
      if (!map[stage]) map[stage] = [];
      map[stage].push(c);
    });
    // مرتب‌سازی داخل هر ستون بر اساس آخرین فعالیت (نزولی) تا جدیدترین‌ها بالاتر باشند
    Object.keys(map).forEach((k) => {
      map[k].sort(
        (a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt),
      );
    });
    return map;
  }, [customers]);

  const advisorOptions = useMemo(
    () =>
      (users || [])
        .filter((u) => u.role === "advisor")
        .map((u) => ({ value: String(u.id), label: u.name })),
    [users],
  );

  // مدیریت پایان drag
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const newStage = destination.droppableId;
    const customerId = Number(draggableId);
    const customer = customers.find((c) => c.id === customerId);
    const oldStage = customer?.pipelineStage || "new";

    // بهینه‌سازی اپتیستیک: بلافاصله در UI جابجا کنیم
    setData((prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((c) =>
        c.id === customerId ? { ...c, pipelineStage: newStage } : c,
      );
    });

    const tid = toast.loading("در حال ذخیره…");
    try {
      await customerService.update(customerId, { pipelineStage: newStage });
      toast.success(
        `«${customer?.name || ""}» به مرحله «${getLabel(PIPELINE_STAGES, newStage)}» منتقل شد`,
        { id: tid },
      );
      // ثبت فعالیت
      try {
        await reportService.createActivity({
          userId: user?.id,
          action: "updated_pipeline",
          description: `مرحله پایپ‌لاین «${customer?.name || ""}» از «${getLabel(PIPELINE_STAGES, oldStage)}» به «${getLabel(PIPELINE_STAGES, newStage)}» تغییر کرد`,
          entityType: "customer",
          entityId: customerId,
          createdAt: new Date().toISOString(),
        });
      } catch {
        /* غیربحرانی */
      }
    } catch (err) {
      toast.error(err.message || "خطا در به‌روزرسانی مرحله", { id: tid });
      // بازگردانی UI
      refetch();
    }
  };

  const handleView = (customer) => {
    setProfileCustomer(customer);
    setProfileOpen(true);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="پایپ‌لاین فروش" icon={TrendingUp} />
        <ScrollAnimate type="fade" delay={0}>
          <div className="surface-card">
            <EmptyState
              icon={AlertCircle}
              title="خطا در بارگذاری"
              description={error}
              action={
                <button
                  onClick={refetch}
                  className="press-effect inline-flex items-center gap-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white px-4 h-10 text-sm font-medium cursor-pointer transition-colors"
                >
                  تلاش مجدد
                </button>
              }
            />
          </div>
        </ScrollAnimate>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="پایپ‌لاین فروش"
        description="مشتریان را بین مراحل فروش جابجا کنید"
        icon={TrendingUp}
        actions={
          dragDisabled ? (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-surface-muted text-content-muted border border-border">
              <Lock className="w-3 h-3" />
              حالت فقط‌خواندنی
            </span>
          ) : null
        }
      />

      {/* فیلتر مشاور (فقط ادمین) */}
      {isAdmin && (
        <ScrollAnimate type="fade-up" delay={0}>
          <div>
            <FilterBar
              title="فیلتر پایپ‌لاین"
              hasActiveFilters={!!filterAdvisor}
              onReset={() => setFilterAdvisor("")}
            >
              <FilterItem label="مشاور">
                <Select
                  options={advisorOptions}
                  value={filterAdvisor}
                  onChange={(e) => setFilterAdvisor(e.target.value)}
                  placeholder="همه مشاوران"
                />
              </FilterItem>
            </FilterBar>
          </div>
        </ScrollAnimate>
      )}

      {/* خلاصه شمارش */}
      <ScrollAnimate type="fade-up" delay={100}>
        <div className="flex flex-wrap items-center gap-2 text-sm text-content-muted">
          <span>
            مجموع مشتریان:{" "}
            <span className="font-semibold text-content">
              {fa(customers.length)}
            </span>
          </span>
          {loading && <span className="text-xs">• در حال بارگذاری…</span>}
        </div>
      </ScrollAnimate>

      {/* بورد کانبان */}
      {loading ? (
        <LoadingSpinner fullPage label="در حال بارگذاری پایپ‌لاین…" />
      ) : customers.length === 0 ? (
        <ScrollAnimate type="fade" delay={0}>
          <div className="surface-card">
            <EmptyState
              icon={UsersIcon}
              title="مشتری‌ای یافت نشد"
              description={
                filterAdvisor
                  ? "فیلتر مشاور را تغییر دهید یا پاک کنید"
                  : "هنوز مشتری‌ای در پایپ‌لاین ثبت نشده است"
              }
              action={
                filterAdvisor ? (
                  <button
                    onClick={() => setFilterAdvisor("")}
                    className="press-effect inline-flex items-center gap-2 rounded-xl bg-surface border border-border hover:bg-surface-muted text-content px-4 h-10 text-sm font-medium cursor-pointer transition-colors"
                  >
                    پاک کردن فیلتر
                  </button>
                ) : null
              }
            />
          </div>
        </ScrollAnimate>
      ) : (
        <div className="overflow-x-auto pb-4 -mx-1 px-1">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 min-w-max items-start">
              {PIPELINE_STAGES.map((stage) => (
                <KanbanColumn
                  key={stage.value}
                  stage={stage}
                  customers={grouped[stage.value] || []}
                  userMap={userMap}
                  isDragDisabled={dragDisabled}
                  onView={handleView}
                />
              ))}
            </div>
          </DragDropContext>
        </div>
      )}

      {/* مودال پروفایل مشتری */}
      <CustomerProfile
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        customer={profileCustomer}
        canEdit={canWrite()}
      />
    </div>
  );
}
