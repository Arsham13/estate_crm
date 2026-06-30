// RevenueChart — نمودار خطی درآمد (مجموع کمیسیون قراردادها) در ۶ ماه گذشته با برچسب ماه شمسی
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
  Legend,
} from "recharts";
import moment from "moment-jalaali";
import { formatCompactCurrency } from "../../utils/formatters.js";

// تبدیل عدد به فارسی برای برچسب‌ها
const fa = (n) => Number(n).toLocaleString("fa-IR");

/**
 * RevenueChart
 * props:
 *  - contracts: آرایه قراردادها (شامل amount/commission/startDate/createdAt)
 *  - delay: تأخیر انیمیشن
 */
export default function RevenueChart({ contracts = [], delay = 100 }) {
  // ساخت داده‌های ۶ ماه گذشته بر اساس startDate قراردادها
  const data = useMemo(() => {
    const months = [];
    const today = moment();
    for (let i = 5; i >= 0; i--) {
      const m = moment(today).subtract(i, "jMonth");
      const label = m.format("jMMMM");
      const start = m.startOf("jMonth").toDate();
      const end = m.endOf("jMonth").toDate();
      const monthContracts = contracts.filter((c) => {
        const d = new Date(c.startDate || c.createdAt);
        return d >= start && d <= end;
      });
      const totalAmount = monthContracts.reduce(
        (s, c) => s + Number(c.amount || 0),
        0,
      );
      const totalCommission = monthContracts.reduce(
        (s, c) => s + Number(c.commission || 0),
        0,
      );
      months.push({
        name: label,
        amount: totalAmount,
        commission: totalCommission,
        count: monthContracts.length,
      });
    }
    return months;
  }, [contracts]);

  // تابع فرمت مقادیر محور Y — کوتاه‌سازی اعداد بزرگ
  const formatY = (v) => {
    if (v >= 1000000000) return `${fa(Math.round(v / 1000000000))} م‌ت`;
    if (v >= 1000000) return `${fa(Math.round(v / 1000000))} م`;
    return fa(v);
  };

  // تولتیپ اختصاصی فارسی
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-surface border border-border rounded-xl shadow-card p-3 text-xs space-y-1.5">
        <p className="font-bold text-content">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-content-muted">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: p.color || p.stroke }}
              />
              {p.name}
            </span>
            <span className="font-semibold text-content">
              {formatCompactCurrency(p.value)} تومان
            </span>
          </div>
        ))}
        {payload[0]?.payload?.count !== undefined && (
          <p className="text-content-muted pt-1 border-t border-border">
            تعداد قراردادها: {fa(payload[0].payload.count)}
          </p>
        )}
      </div>
    );
  };

  return (
    <ScrollAnimate type="fade-up" delay={0}>
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-content">
              درآمد ۶ ماه اخیر
            </h3>
            <p className="text-sm text-content-muted mt-0.5">
              مجموع مبلغ و کمیسیون قراردادها
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-content-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-600" />
              کمیسیون
            </span>
            <span className="flex items-center gap-1.5 text-content-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-300" />
              مبلغ کل
            </span>
          </div>
        </div>

        <div className="w-full" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="goldLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#D4A017" />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
              />
              <YAxis
                tickFormatter={formatY}
                tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="amount"
                name="مبلغ کل"
                stroke="#FCD34D"
                strokeWidth={2}
                dot={{ r: 3, fill: "#FCD34D" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="commission"
                name="کمیسیون"
                stroke="url(#goldLineGrad)"
                strokeWidth={3}
                dot={{ r: 4, fill: "#D4A017" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ScrollAnimate>
  );
}
