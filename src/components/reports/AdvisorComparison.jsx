// AdvisorComparison — نمودار میله‌ای گروهی برای مقایسه مشاوران بر اساس تعداد قرارداد، کمیسیون کل و تعداد مشتری
import ScrollAnimate from "../common/ScrollAnimate.jsx";
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import {
  formatCurrency,
  formatCompactCurrency,
  formatNumber,
} from "../../utils/formatters.js";

const fa = (n) => Number(n || 0).toLocaleString("fa-IR");

// پالت رنگ‌های متمایز برای مشاوران (دور از indigo/blue تا حد امکان)
const ADVISOR_COLORS = [
  "#D4A017", // gold
  "#10B981", // emerald
  "#F97316", // orange
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#14B8A6", // teal
  "#EAB308", // yellow
  "#84CC16", // lime
  "#06B6D4", // cyan
  "#F43F5E", // rose
];

const METRICS = [
  { key: "contracts", label: "تعداد قراردادها", format: (v) => `${fa(v)} عدد` },
  {
    key: "commission",
    label: "کمیسیون کل",
    format: (v) => `${formatCurrency(v)} ت`,
  },
  { key: "customers", label: "تعداد مشتریان", format: (v) => `${fa(v)} نفر` },
];

/**
 * AdvisorComparison
 * props:
 *  - contracts: آرایه قراردادها
 *  - customers: آرایه مشتریان (برای شمارش مشتریان هر مشاور)
 *  - users: آرایه کاربران (برای فیلتر کردن مشاوران)
 *  - delay: تأخیر انیمیشن (ms)
 *  - height: ارتفاع نمودار (px)
 */
export default function AdvisorComparison({
  contracts = [],
  customers = [],
  users = [],
  delay = 200,
  height = 360,
}) {
  // استخراج لیست مشاوران از users (فقط نقش advisor)
  const advisors = useMemo(() => {
    return (users || [])
      .filter((u) => u.role === "advisor")
      .sort((a, b) => a.id - b.id);
  }, [users]);

  // محاسبه آمار هر مشاور
  const advisorStats = useMemo(() => {
    const stats = {};
    advisors.forEach((a) => {
      stats[a.id] = { contracts: 0, commission: 0, customers: 0 };
    });
    contracts.forEach((c) => {
      if (stats[c.advisorId]) {
        stats[c.advisorId].contracts += 1;
        stats[c.advisorId].commission += Number(c.commission || 0);
      }
    });
    customers.forEach((cu) => {
      if (stats[cu.assignedTo]) {
        stats[cu.assignedTo].customers += 1;
      }
    });
    return stats;
  }, [advisors, contracts, customers]);

  // محاسبه حداکثر هر معیار برای نرمال‌سازی (۰ تا ۱۰۰)
  const maxByMetric = useMemo(() => {
    const max = { contracts: 1, commission: 1, customers: 1 };
    advisors.forEach((a) => {
      const s = advisorStats[a.id];
      if (!s) return;
      if (s.contracts > max.contracts) max.contracts = s.contracts;
      if (s.commission > max.commission) max.commission = s.commission;
      if (s.customers > max.customers) max.customers = s.customers;
    });
    return max;
  }, [advisors, advisorStats]);

  // ساخت داده برای Recharts — یک ردیف به ازای هر معیار، شامل مقدار نرمال‌شده هر مشاور
  // علاوه بر آن، مقادیر اصلی در کلید `${id}_raw` ذخیره می‌شوند تا در tooltip استفاده شوند
  const data = useMemo(() => {
    return METRICS.map((metric) => {
      const row = { metric: metric.label };
      advisors.forEach((a, idx) => {
        const s = advisorStats[a.id] || {
          contracts: 0,
          commission: 0,
          customers: 0,
        };
        const raw = s[metric.key] || 0;
        const norm =
          maxByMetric[metric.key] > 0
            ? Math.round((raw / maxByMetric[metric.key]) * 100)
            : 0;
        row[`a${a.id}`] = norm;
        row[`a${a.id}_raw`] = raw;
        row[`a${a.id}_name`] = a.name;
        row[`a${a.id}_color`] = ADVISOR_COLORS[idx % ADVISOR_COLORS.length];
      });
      return row;
    });
  }, [advisors, advisorStats, maxByMetric]);

  // تولتیپ اختصاصی — نمایش مقدار اصلی هر مشاور برای آن معیار
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const row = payload[0]?.payload || {};
    const metric = METRICS.find((m) => m.label === label);
    return (
      <div className="bg-surface border border-border rounded-xl shadow-card p-3 text-xs space-y-1.5 min-w-[200px]">
        <p className="font-bold text-content border-b border-border pb-1.5">
          {label}
        </p>
        {advisors.map((a, idx) => {
          const raw = row[`a${a.id}_raw`] || 0;
          const color = ADVISOR_COLORS[idx % ADVISOR_COLORS.length];
          return (
            <div key={a.id} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-content-muted">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: color }}
                />
                {a.name}
              </span>
              <span className="font-semibold text-content">
                {metric ? metric.format(raw) : fa(raw)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // رندر legend سفارشی — نام مشاور با رنگ متمایز
  const renderLegend = (props) => {
    const { payload } = props;
    if (!payload || !payload.length) return null;
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-3">
        {payload.map((entry, idx) => {
          const advisor = advisors[idx];
          if (!advisor) return null;
          const color = ADVISOR_COLORS[idx % ADVISOR_COLORS.length];
          return (
            <div
              key={entry.dataKey}
              className="flex items-center gap-1.5 text-xs text-content-muted"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: color }}
              />
              {advisor.name}
            </div>
          );
        })}
      </div>
    );
  };

  // اگر هیچ مشاوری وجود ندارد
  if (advisors.length === 0) {
    return (
      <ScrollAnimate type="fade-up" delay={0}>
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
          <h3 className="text-base font-bold text-content">مقایسه مشاوران</h3>
          <div className="flex items-center justify-center text-sm text-content-muted py-16">
            مشاوری برای مقایسه وجود ندارد
          </div>
        </div>
      </ScrollAnimate>
    );
  }

  return (
    <ScrollAnimate type="fade-up" delay={0}>
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
        {/* هدر */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-content">
              مقایسه عملکرد مشاوران
            </h3>
            <p className="text-sm text-content-muted mt-0.5">
              مقایسه بر اساس تعداد قرارداد، کمیسیون کل و تعداد مشتریان
            </p>
          </div>
          <div className="text-xs text-content-muted">
            ارتفاع میله‌ها نسبت به بیشترین مقدار هر معیار نرمال‌شده است
          </div>
        </div>

        {/* نمودار */}
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              barGap={4}
              barCategoryGap="22%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="metric"
                tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${fa(v)}٪`}
                tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(212, 160, 23, 0.08)" }}
              />
              <Legend content={renderLegend} />
              {advisors.map((a, idx) => (
                <Bar
                  key={a.id}
                  dataKey={`a${a.id}`}
                  name={a.name}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={`cell-${a.id}-${i}`}
                      fill={ADVISOR_COLORS[idx % ADVISOR_COLORS.length]}
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* جدول خلاصه زیر نمودار */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-content-muted">
                <th className="text-right py-2 px-3 font-medium">مشاور</th>
                <th className="text-right py-2 px-3 font-medium">قراردادها</th>
                <th className="text-right py-2 px-3 font-medium">کمیسیون کل</th>
                <th className="text-right py-2 px-3 font-medium">مشتریان</th>
              </tr>
            </thead>
            <tbody>
              {advisors.map((a, idx) => {
                const s = advisorStats[a.id] || {
                  contracts: 0,
                  commission: 0,
                  customers: 0,
                };
                return (
                  <tr
                    key={a.id}
                    className="border-b border-border last:border-0 hover:bg-surface-muted/40 transition-colors"
                  >
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-2 text-content font-medium">
                        <span
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{
                            background:
                              ADVISOR_COLORS[idx % ADVISOR_COLORS.length],
                          }}
                        />
                        {a.name}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-content">
                      {fa(s.contracts)}
                    </td>
                    <td className="py-2 px-3 text-content font-medium">
                      {formatCompactCurrency(s.commission)} ت
                    </td>
                    <td className="py-2 px-3 text-content">
                      {fa(s.customers)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ScrollAnimate>
  );
}
