// SourceChart — نمودار دایره‌ای توزیع منابع آشنایی مشتریان
import ScrollAnimate from "../common/ScrollAnimate.jsx";
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { CUSTOMER_SOURCES } from "../../utils/constants.js";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// رنگ‌های متنوع برای هر منبع (بد استفاده نکردیم طبق قانون)
const COLORS = ["#D4A017", "#10B981", "#F97316", "#A855F7", "#06B6D4"];

/**
 * SourceChart
 * props:
 *  - customers: آرایه مشتریان
 *  - delay: تأخیر انیمیشن
 */
export default function SourceChart({ customers = [], delay = 200 }) {
  const data = useMemo(() => {
    const counts = {};
    customers.forEach((c) => {
      const key = c.source || "other";
      counts[key] = (counts[key] || 0) + 1;
    });
    return CUSTOMER_SOURCES.map((s) => ({
      name: s.label,
      value: counts[s.value] || 0,
      key: s.value,
    })).filter((d) => d.value > 0);
  }, [customers]);

  const total = data.reduce((s, d) => s + d.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0];
    const pct = total ? Math.round((p.value / total) * 100) : 0;
    return (
      <div className="bg-surface border border-border rounded-xl shadow-card p-2.5 text-xs">
        <p className="font-bold text-content">{p.name}</p>
        <p className="text-content-muted mt-0.5">
          {fa(p.value)} مشتری ({fa(pct)}٪)
        </p>
      </div>
    );
  };

  // رندر لیبل سفارشی برای legend
  // در recharts، entry.value نام منبع است و entry.payload.value تعداد است.
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3 text-xs">
        {payload.map((entry, i) => {
          const count = entry?.payload?.value ?? 0;
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <li
              key={i}
              className="flex items-center gap-1.5 text-content-muted"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: entry.color }}
              />
              <span>{entry.value}</span>
              <span className="text-content">— {fa(pct)}٪</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <ScrollAnimate type="fade-up" delay={0}>
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
        <div className="mb-4">
          <h3 className="text-base font-bold text-content">
            منابع آشنایی مشتریان
          </h3>
          <p className="text-sm text-content-muted mt-0.5">
            توزیع مشتریان بر اساس کانال ورودی
          </p>
        </div>

        {total === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-sm text-content-muted">
            داده‌ای موجود نیست
          </div>
        ) : (
          <div className="w-full" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                >
                  {data.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  content={renderLegend}
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* مجموع پایین نمودار */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-content-muted">مجموع مشتریان</span>
          <span className="text-sm font-bold text-content">
            {fa(total)} نفر
          </span>
        </div>
      </div>
    </ScrollAnimate>
  );
}
