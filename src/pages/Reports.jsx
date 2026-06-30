// Reports — صفحه گزارش مالی با نمودار درآمد ۱۲ ماه، مقایسه مشاوران (ادمین)، جدول کمیسیون و خروجی CSV
import ScrollAnimate from "../components/common/ScrollAnimate.jsx";
import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Wallet,
  FileText,
  TrendingUp,
  CalendarDays,
  Download,
  AlertCircle,
  Inbox,
} from "lucide-react";
import moment from "moment-jalaali";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { contractService } from "../services/contractService.js";
import { customerService } from "../services/customerService.js";
import { authService } from "../services/authService.js";
import PageHeader from "../components/common/PageHeader.jsx";
import Button from "../components/common/Button.jsx";
import FilterBar, { FilterItem } from "../components/common/FilterBar.jsx";
import Select from "../components/common/Select.jsx";
import StatCard from "../components/dashboard/StatCard.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import RevenueReport from "../components/reports/RevenueReport.jsx";
import AdvisorComparison from "../components/reports/AdvisorComparison.jsx";
import ReportTable from "../components/reports/ReportTable.jsx";
import { DATE_RANGES } from "../utils/constants.js";
import {
  formatCurrency,
  formatCompactCurrency,
  toJalali,
} from "../utils/formatters.js";
import { getLabel, filterByDateRange } from "../utils/helpers.js";
import { downloadCSV } from "../utils/exportCSV.js";
import { CONTRACT_STATUS, CONTRACT_TYPES } from "../utils/constants.js";

const fa = (n) => Number(n || 0).toLocaleString("fa-IR");

export default function Reports() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole(["admin"]);

  // واکشی داده‌ها
  const {
    data: contractsRaw,
    loading,
    error,
    refetch,
  } = useApi(() => contractService.getAll({ _limit: 1000 }), []);

  const { data: customers } = useApi(
    () => customerService.getAll({ _limit: 1000 }),
    [],
  );
  const { data: users } = useApi(() => authService.getAll(), []);

  // state فیلترها
  const [filterDate, setFilterDate] = useState("all");
  const [filterAdvisor, setFilterAdvisor] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // نقشه‌ها برای resolve نام‌ها
  const customerMap = useMemo(() => {
    const map = {};
    (customers || []).forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [customers]);

  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      map[u.id] = u;
    });
    return map;
  }, [users]);

  // اعمال فیلتر نقش + فیلتر مشاور + بازه زمانی
  const filteredContracts = useMemo(() => {
    if (!contractsRaw) return [];
    let list = contractsRaw;

    // فیلتر نقش: advisor فقط داده‌های خودش
    if (!isAdmin) {
      list = list.filter((c) => c.advisorId === user?.id);
    } else if (filterAdvisor) {
      // ادمین می‌تواند مشاور خاص را فیلتر کند
      list = list.filter((c) => String(c.advisorId) === filterAdvisor);
    }

    // فیلتر بازه زمانی — بر اساس startDate قرارداد
    list = filterByDateRange(list, "startDate", filterDate);

    return list;
  }, [contractsRaw, isAdmin, user, filterAdvisor, filterDate]);

  // برای نمودار درآمد ۱۲ ماه، روی قراردادهای فیلتر‌شده‌ی مشاور (بدون فیلتر بازه زمانی)
  // تا همیشه ۱۲ ماه گذشته نمایش داده شود
  const contractsForRevenueChart = useMemo(() => {
    if (!contractsRaw) return [];
    let list = contractsRaw;
    if (!isAdmin) {
      list = list.filter((c) => c.advisorId === user?.id);
    } else if (filterAdvisor) {
      list = list.filter((c) => String(c.advisorId) === filterAdvisor);
    }
    return list;
  }, [contractsRaw, isAdmin, user, filterAdvisor]);

  // آمار کلیدی در بازه انتخاب‌شده
  const stats = useMemo(() => {
    const totalRevenue = filteredContracts.reduce(
      (s, c) => s + Number(c.commission || 0),
      0,
    );
    const totalContracts = filteredContracts.length;
    const avgCommission =
      totalContracts > 0 ? totalRevenue / totalContracts : 0;

    // محاسبه بهترین ماه (بیشترین کمیسیون) — بر اساس ماه شمسی startDate
    const byMonth = {};
    filteredContracts.forEach((c) => {
      if (!c.startDate) return;
      const m = moment(c.startDate);
      const key = m.format("jYYYY-jMM");
      const name = m.format("jMMMM jYYYY");
      if (!byMonth[key]) byMonth[key] = { name, value: 0, count: 0 };
      byMonth[key].value += Number(c.commission || 0);
      byMonth[key].count += 1;
    });
    const monthsArr = Object.values(byMonth).sort((a, b) => b.value - a.value);
    const bestMonth = monthsArr[0] || null;

    return {
      totalRevenue,
      totalContracts,
      avgCommission,
      bestMonth,
    };
  }, [filteredContracts]);

  // خروجی CSV از جدول
  const handleExportCSV = () => {
    if (filteredContracts.length === 0) {
      toast.error("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const rows = filteredContracts.map((c) => ({
      code: c.code || "",
      customer: customerMap[c.customerId]?.name || "",
      advisor: userMap[c.advisorId]?.name || "",
      amount: c.amount || 0,
      commission: c.commission || 0,
      startDate: toJalali(c.startDate),
      status: getLabel(CONTRACT_STATUS, c.status),
      type: getLabel(CONTRACT_TYPES, c.type),
    }));
    const columns = [
      { key: "code", label: "کد قرارداد" },
      { key: "customer", label: "مشتری" },
      { key: "advisor", label: "مشاور" },
      { key: "amount", label: "مبلغ قرارداد" },
      { key: "commission", label: "کمیسیون" },
      { key: "startDate", label: "تاریخ شروع" },
      { key: "status", label: "وضعیت" },
      { key: "type", label: "نوع" },
    ];
    downloadCSV(rows, columns, `financial-report-${Date.now()}.csv`);
    toast.success("فایل CSV دانلود شد");
  };

  const hasActiveFilters = filterDate !== "all" || (!!filterAdvisor && isAdmin);

  const handleResetFilters = () => {
    setFilterDate("all");
    setFilterAdvisor("");
  };

  useEffect(() => {
    setPage(1);
  }, [filterDate, filterAdvisor]);

  // pagination برای جدول
  const totalPages = Math.max(
    1,
    Math.ceil(filteredContracts.length / PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const pagedContracts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredContracts.slice(start, start + PAGE_SIZE);
  }, [filteredContracts, safePage]);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="گزارش مالی" icon={BarChart3} />
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
      {/* هدر صفحه */}
      <PageHeader
        title="گزارش مالی"
        description={
          isAdmin
            ? "تحلیل درآمد، کمیسیون و عملکرد مشاوران"
            : "تحلیل درآمد و کمیسیون قراردادهای شما"
        }
        icon={BarChart3}
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
            disabled={loading || filteredContracts.length === 0}
          >
            خروجی CSV
          </Button>
        }
      />

      {/* فیلترها */}
      <ScrollAnimate type="fade-up" delay={100}>
        <div>
          <FilterBar
            onReset={handleResetFilters}
            hasActiveFilters={!!hasActiveFilters}
            title="فیلتر گزارش"
          >
            <FilterItem label="بازه زمانی">
              <Select
                options={DATE_RANGES}
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                placeholder="انتخاب بازه…"
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
            <FilterItem label="نمایش بر اساس">
              <div className="h-10 px-3.5 flex items-center text-sm text-content-muted bg-surface-muted/40 rounded-xl border border-border">
                <CalendarDays className="w-4 h-4 ml-2 text-gold-600" />
                تاریخ شروع قرارداد
              </div>
            </FilterItem>
          </FilterBar>
        </div>
      </ScrollAnimate>

      {loading ? (
        <LoadingSpinner fullPage label="در حال بارگذاری گزارش…" />
      ) : filteredContracts.length === 0 && !isAdmin ? (
        <ScrollAnimate type="fade" delay={0}>
          <div className="surface-card">
            <EmptyState
              icon={Inbox}
              title="داده‌ای برای نمایش وجود ندارد"
              description="در بازه انتخاب‌شده قراردادی ثبت نشده است"
            />
          </div>
        </ScrollAnimate>
      ) : (
        <>
          {/* کارت‌های آماری */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              icon={Wallet}
              title="مجموع درآمد (کمیسیون)"
              value={`${formatCompactCurrency(stats.totalRevenue)} ت`}
              color="gold"
              delay={100}
              footer={`معادل ${formatCurrency(stats.totalRevenue)} تومان`}
            />
            <StatCard
              icon={FileText}
              title="تعداد قراردادها"
              value={`${fa(stats.totalContracts)} قرارداد`}
              color="emerald"
              delay={200}
              footer="در بازه انتخاب‌شده"
            />
            <StatCard
              icon={TrendingUp}
              title="بهترین ماه"
              value={stats.bestMonth ? stats.bestMonth.name : "—"}
              color="purple"
              delay={300}
              footer={
                stats.bestMonth
                  ? `${formatCompactCurrency(stats.bestMonth.value)} ت کمیسیون`
                  : "داده‌ای موجود نیست"
              }
            />
            <StatCard
              icon={BarChart3}
              title="میانگین کمیسیون"
              value={`${formatCompactCurrency(stats.avgCommission)} ت`}
              color="amber"
              delay={400}
              footer="به ازای هر قرارداد"
            />
          </div>

          {/* نمودار درآمد ۱۲ ماه گذشته — تمام عرض */}
          <RevenueReport
            contracts={contractsForRevenueChart}
            delay={500}
            height={320}
          />

          {/* نمودار مقایسه مشاوران — فقط ادمین، تمام عرض */}
          {isAdmin && (
            <AdvisorComparison
              contracts={contractsForRevenueChart}
              customers={customers || []}
              users={users || []}
              delay={600}
              height={360}
            />
          )}

          {/* جدول کمیسیون به ازای هر قرارداد */}
          <ReportTable
            contracts={filteredContracts}
            customerMap={customerMap}
            userMap={userMap}
            delay={700}
          />

          {/* Pagination ساده برای جدول (در صورت نیاز) */}
          {filteredContracts.length > PAGE_SIZE && (
            <div className="flex items-center justify-between text-sm text-content-muted px-1">
              <span>
                نمایش {fa((safePage - 1) * PAGE_SIZE + 1)} تا{" "}
                {fa(Math.min(safePage * PAGE_SIZE, filteredContracts.length))}{" "}
                از {fa(filteredContracts.length)} قرارداد
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  قبلی
                </Button>
                <span className="px-2">
                  صفحه {fa(safePage)} از {fa(totalPages)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
                  بعدی
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
