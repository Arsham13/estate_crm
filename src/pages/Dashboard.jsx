// Dashboard — صفحه اصلی داشبورد با کارت‌های آمار، نمودارها و لیست‌های اطلاعات
import ScrollAnimate from "../components/common/ScrollAnimate.jsx";
import React, { useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  DollarSign,
  Target,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { customerService } from "../services/customerService.js";
import { propertyService } from "../services/propertyService.js";
import { contractService } from "../services/contractService.js";
import { taskService } from "../services/taskService.js";
import { reportService } from "../services/reportService.js";
import { authService } from "../services/authService.js";
import PageHeader from "../components/common/PageHeader.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import StatCard from "../components/dashboard/StatCard.jsx";
import RevenueChart from "../components/dashboard/RevenueChart.jsx";
import SourceChart from "../components/dashboard/SourceChart.jsx";
import PipelineChart from "../components/dashboard/PipelineChart.jsx";
import TopProperties from "../components/dashboard/TopProperties.jsx";
import TodayTasks from "../components/dashboard/TodayTasks.jsx";
import RecentActivities from "../components/dashboard/RecentActivities.jsx";
import TopAdvisor from "../components/dashboard/TopAdvisor.jsx";
import { formatCompactCurrency } from "../utils/formatters.js";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// محاسبه بازه ماه جاری و ماه قبل
function getMonthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + offset + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { start, end };
}

// محاسبه درصد تغییر (با محافظت در برابر تقسیم بر صفر)
function pctChange(curr, prev) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

export default function Dashboard() {
  const { user } = useAuth();
  // admin و assistant همه داده‌ها را می‌بینند؛ advisor فقط داده‌های خودش
  const seesAll = user?.role === "admin" || user?.role === "assistant";
  const isAdmin = user?.role === "admin";

  // واکشی موازی داده‌ها
  const { data: customers, loading: lc } = useApi(
    () => customerService.getAll({ _limit: 1000 }),
    [],
  );
  const { data: properties, loading: lp } = useApi(
    () => propertyService.getAll({ _limit: 1000 }),
    [],
  );
  const { data: contracts, loading: lct } = useApi(
    () => contractService.getAll({ _limit: 1000 }),
    [],
  );
  const { data: tasks, loading: lt } = useApi(
    () => taskService.getAll({ _limit: 1000 }),
    [],
  );
  const { data: activities, loading: la } = useApi(
    () =>
      reportService.getActivities({
        _limit: 50,
        _sort: "createdAt",
        _order: "desc",
      }),
    [],
  );
  const { data: users, loading: lu } = useApi(() => authService.getAll(), []);

  const loading = lc || lp || lct || lt || (isAdmin && lu);

  // فیلتر داده‌ها بر اساس نقش
  const myCustomers = useMemo(() => {
    if (!customers) return [];
    if (seesAll) return customers;
    return customers.filter((c) => c.assignedTo === user?.id);
  }, [customers, user, seesAll]);

  const myProperties = useMemo(() => {
    if (!properties) return [];
    if (seesAll) return properties;
    return properties.filter((p) => p.assignedTo === user?.id);
  }, [properties, user, seesAll]);

  const myContracts = useMemo(() => {
    if (!contracts) return [];
    if (seesAll) return contracts;
    return contracts.filter((c) => c.advisorId === user?.id);
  }, [contracts, user, seesAll]);

  const myTasks = useMemo(() => {
    if (!tasks) return [];
    if (seesAll) return tasks;
    return tasks.filter((t) => t.assignedTo === user?.id);
  }, [tasks, user, seesAll]);

  // محاسبه آمارها
  const stats = useMemo(() => {
    const currMonth = getMonthRange(0);
    const prevMonth = getMonthRange(-1);

    // مشتریان فعال (در پایپ‌لاین — به‌جز lost و closed)
    const activeCustomers = myCustomers.filter(
      (c) => c.pipelineStage !== "lost" && c.pipelineStage !== "closed",
    );

    // مشتریان جدید این ماه و ماه قبل
    const inRange = (arr, field, range) =>
      arr.filter((c) => {
        const d = new Date(c[field]);
        return d >= range.start && d <= range.end;
      });
    const newCustomersCurr = inRange(
      myCustomers,
      "createdAt",
      currMonth,
    ).length;
    const newCustomersPrev = inRange(
      myCustomers,
      "createdAt",
      prevMonth,
    ).length;

    // ملک‌های موجود
    const availableProps = myProperties.filter((p) => p.status === "available");
    const newPropsCurr = inRange(myProperties, "createdAt", currMonth).length;
    const newPropsPrev = inRange(myProperties, "createdAt", prevMonth).length;

    // قراردادهای ماه جاری و قبلی
    const monthContracts = myContracts.filter((c) => {
      const d = new Date(c.startDate || c.createdAt);
      return (
        d >= currMonth.start && d <= currMonth.end && c.status !== "canceled"
      );
    });
    const prevMonthContracts = myContracts.filter((c) => {
      const d = new Date(c.startDate || c.createdAt);
      return (
        d >= prevMonth.start && d <= prevMonth.end && c.status !== "canceled"
      );
    });
    const monthCommission = monthContracts.reduce(
      (s, c) => s + Number(c.commission || 0),
      0,
    );
    const prevMonthCommission = prevMonthContracts.reduce(
      (s, c) => s + Number(c.commission || 0),
      0,
    );

    // نرخ تبدیل: مشتریان closed به‌ازای کل مشتریان
    const closedCustomers = myCustomers.filter(
      (c) => c.pipelineStage === "closed",
    ).length;
    const conversionRate =
      myCustomers.length > 0 ? (closedCustomers / myCustomers.length) * 100 : 0;

    return {
      activeCustomers: activeCustomers.length,
      availableProps: availableProps.length,
      monthContractsCount: monthContracts.length,
      monthCommission,
      conversionRate,
      newCustomersCurr,
      newCustomersPrev,
      newPropsCurr,
      newPropsPrev,
      prevMonthContractsCount: prevMonthContracts.length,
      prevMonthCommission,
      closedCustomers,
      totalCustomers: myCustomers.length,
    };
  }, [myCustomers, myProperties, myContracts]);

  if (loading) {
    return <LoadingSpinner fullPage label="در حال بارگذاری داشبورد..." />;
  }

  // در صورت خطای قطعی داده — اگر هیچ داده‌ای نبود، هشدار ملایم
  const hasNoData =
    myCustomers.length === 0 &&
    myProperties.length === 0 &&
    myContracts.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="داشبورد"
        description={
          seesAll
            ? "نمای کلی عملکرد سیستم و تیم مشاوران"
            : `نمای کلی فعالیت‌های شما${user?.name ? ` — ${user.name}` : ""}`
        }
        icon={LayoutDashboard}
      />

      {/* هشدار عدم داده برای مشاور بدون تخصیص */}
      {hasNoData && (
        <ScrollAnimate type="fade" delay={0}>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">
                هنوز داده‌ای به شما تخصیص نیافته است
              </p>
              <p className="mt-0.5 opacity-90">
                در صورت اینکه فکر می‌کنید باید داده‌ای به شما اختصاص داده شود،
                با مدیر سیستم تماس بگیرید.
              </p>
            </div>
          </div>
        </ScrollAnimate>
      )}

      {/* ردیف کارت‌های آمار */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          icon={Users}
          title="مشتریان فعال"
          value={fa(stats.activeCustomers)}
          change={pctChange(stats.newCustomersCurr, stats.newCustomersPrev)}
          color="gold"
          delay={0}
          footer={`از مجموع ${fa(stats.totalCustomers)} مشتری`}
        />
        <StatCard
          icon={Building2}
          title="ملک‌های موجود"
          value={fa(stats.availableProps)}
          change={pctChange(stats.newPropsCurr, stats.newPropsPrev)}
          color="sky"
          delay={100}
          footer={`${fa(myProperties.length)} ملک کل`}
        />
        <StatCard
          icon={FileText}
          title="قراردادهای این ماه"
          value={fa(stats.monthContractsCount)}
          change={pctChange(
            stats.monthContractsCount,
            stats.prevMonthContractsCount,
          )}
          color="emerald"
          delay={200}
          footer={`${fa(stats.prevMonthContractsCount)} قرارداد ماه قبل`}
        />
        <StatCard
          icon={DollarSign}
          title="کمیسیون این ماه"
          value={`${formatCompactCurrency(stats.monthCommission)} ت`}
          change={pctChange(stats.monthCommission, stats.prevMonthCommission)}
          color="purple"
          delay={300}
          footer={`${formatCompactCurrency(stats.prevMonthCommission)} ت ماه قبل`}
        />
        <StatCard
          icon={Target}
          title="نرخ تبدیل"
          value={`${fa(stats.conversionRate.toFixed(1))}٪`}
          color="amber"
          delay={400}
          progress={stats.conversionRate}
          progressLabel={`${fa(stats.closedCustomers)} از ${fa(stats.totalCustomers)} مشتری`}
        />
      </section>

      {/* بخش ادمین: برترین مشاور ماه */}
      {isAdmin && (
        <ScrollAnimate type="fade-up" delay={100}>
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <TopAdvisor
                contracts={contracts || []}
                users={users || []}
                delay={0}
              />
            </div>

            {/* خلاصه کمیسیون کل و تعداد کاربران */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ScrollAnimate type="fade-up" delay={100}>
                <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
                  <p className="text-sm text-content-muted">
                    کل کمیسیون (همه زمان‌ها)
                  </p>
                  <p className="text-2xl font-bold text-gold-600 dark:text-gold-400 mt-2">
                    {formatCompactCurrency(
                      (contracts || []).reduce(
                        (s, c) => s + Number(c.commission || 0),
                        0,
                      ),
                    )}{" "}
                    ت
                  </p>
                  <p className="text-xs text-content-muted mt-2">
                    از {fa((contracts || []).length)} قرارداد
                  </p>
                </div>
              </ScrollAnimate>
              <ScrollAnimate type="fade-up" delay={200}>
                <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
                  <p className="text-sm text-content-muted">تعداد مشاوران</p>
                  <p className="text-2xl font-bold text-content mt-2">
                    {fa(
                      (users || []).filter(
                        (u) => u.role === "advisor" && u.isActive,
                      ).length,
                    )}
                  </p>
                  <p className="text-xs text-content-muted mt-2">مشاور فعال</p>
                </div>
              </ScrollAnimate>
              <ScrollAnimate type="fade-up" delay={300}>
                <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
                  <p className="text-sm text-content-muted">کل قراردادها</p>
                  <p className="text-2xl font-bold text-content mt-2">
                    {fa(
                      (contracts || []).filter((c) => c.status === "active")
                        .length,
                    )}
                  </p>
                  <p className="text-xs text-content-muted mt-2">
                    قرارداد فعال
                  </p>
                </div>
              </ScrollAnimate>
            </div>
          </section>
        </ScrollAnimate>
      )}

      {/* بخش نمودارها */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart contracts={myContracts} delay={0} />
        </div>
        <div className="lg:col-span-1">
          <SourceChart customers={myCustomers} delay={100} />
        </div>
        <div className="lg:col-span-3">
          <PipelineChart customers={myCustomers} delay={200} />
        </div>
      </section>

      {/* بخش پایین: ملک‌های پربازدید، وظایف امروز، فعالیت‌های اخیر */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopProperties properties={myProperties} delay={0} />
        <TodayTasks tasks={myTasks} delay={100} />
        <RecentActivities
          activities={activities || []}
          users={users || []}
          delay={200}
        />
      </section>
    </div>
  );
}
