// RevenueReport — نمودار خطی درآمد ماهانه (مجموع کمیسیون قراردادها) در ۱۲ ماه گذشته با برچسب ماه شمسی
import ScrollAnimate from "../common/ScrollAnimate.jsx";
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import moment from "moment-jalaali";
import {
  formatCurrency,
  formatCompactCurrency,
} from "../../utils/formatters.js";

// تبدیل عدد به فارسی برای برچسب‌ها
const fa = (n) => Number(n || 0).toLocaleString("fa-IR");

/**
 * RevenueReport
 * props:
 *  - contracts: آرایه قراردادها (شامل commission و startDate/createdAt)
 *  - delay: تأخیر انیمیشن (ms)
 *  - height: ارتفاع نمودار (px) — پیش‌فرض 320
 */
export default function RevenueReport({
  contracts = [],
  delay = 100,
  height = 320,
}) {
  // ساخت داده‌های ۱۲ ماه گذشته بر اساس startDate قراردادها
  const data = useMemo(() => {
    const months = [];
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const m = moment(today).subtract(i, "jMonth");
      const label = m.format("jMMMM");
      const start = m.startOf("jMonth").toDate();
      const end = m.endOf("jMonth").toDate();
      const monthContracts = contracts.filter((c) => {
        const d = new Date(c.startDate || c.createdAt);
        return d >= start && d <= end;
      });
      const totalCommission = monthContracts.reduce(
        (s, c) => s + Number(c.commission || 0),
        0,
      );
      const totalAmount = monthContracts.reduce(
        (s, c) => s + Number(c.amount || 0),
        0,
      );
      months.push({
        name: label,
        revenue: totalCommission,
        amount: totalAmount,
        count: monthContracts.length,
      });
    }
    return months;
  }, [contracts]);

  // فرمت مقادیر محور Y — کوتاه‌سازی اعداد بزرگ
  const formatY = (v) => {
    if (!v) return "۰";
    if (v >= 1000000000) return `${fa(Math.round(v / 1000000000))} م‌ت`;
    if (v >= 1000000) return `${fa(Math.round(v / 1000000))} م`;
    return fa(v);
  };

  // تولتیپ اختصاصی فارسی با formatCurrency
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const row = payload[0]?.payload || {};
    return (
      <div className="bg-surface border border-border rounded-xl shadow-card p-3 text-xs space-y-1.5 min-w-[180px]">
        <p className="font-bold text-content border-b border-border pb-1.5">
          {label}
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-content-muted">
            <span className="w-2 h-2 rounded-full bg-gold-600" />
            درآمد (کمیسیون)
          </span>
          <span className="font-semibold text-content">
            {formatCurrency(row.revenue)} ت
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-content-muted">
            <span className="w-2 h-2 rounded-full bg-gold-300" />
            مبلغ کل قراردادها
          </span>
          <span className="font-semibold text-content">
            {formatCompactCurrency(row.amount)} ت
          </span>
        </div>
        <p className="text-content-muted pt-1 border-t border-border">
          تعداد قراردادها: {fa(row.count)}
        </p>
      </div>
    );
  };

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalContracts = data.reduce((s, d) => s + d.count, 0);

  return (
    <ScrollAnimate type="fade-up" delay={0}>
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
        {/* هدر */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-content">
              درآمد ۱۲ ماه گذشته
            </h3>
            <p className="text-sm text-content-muted mt-0.5">
              مجموع کمیسیون دریافتی قراردادها در هر ماه شمسی
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex flex-col items-end">
              <span className="text-content-muted">مجموع درآمد</span>
              <span className="font-bold text-gold-700 dark:text-gold-400">
                {formatCompactCurrency(totalRevenue)} ت
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-content-muted">تعداد قراردادها</span>
              <span className="font-bold text-content">
                {fa(totalContracts)}
              </span>
            </div>
          </div>
        </div>

        {/* نمودار خطی */}
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revGoldStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="50%" stopColor="#D4A017" />
                  <stop offset="100%" stopColor="#B8860B" />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tickFormatter={formatY}
                tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "#D4A017",
                  strokeDasharray: "4 4",
                  strokeWidth: 1,
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="درآمد"
                stroke="url(#revGoldStroke)"
                strokeWidth={3}
                dot={{ r: 3, fill: "#D4A017", strokeWidth: 0 }}
                activeDot={{
                  r: 6,
                  fill: "#D4A017",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ScrollAnimate>
  );
}
