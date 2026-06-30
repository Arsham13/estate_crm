// PipelineChart — نمودار میله‌ای افقی تعداد مشتریان در هر مرحله از پایپ‌لاین فروش
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
  Cell,
} from "recharts";
import { PIPELINE_STAGES } from "../../utils/constants.js";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// نگاشت رنگ هر مرحله به hex (برای Bar)
const STAGE_COLORS = {
  new: "#3B82F6",
  following: "#F97316",
  visit: "#D4A017",
  negotiation: "#A855F7",
  closed: "#10B981",
  lost: "#EF4444",
};

/**
 * PipelineChart
 * props:
 *  - customers: آرایه مشتریان
 *  - delay: تأخیر انیمیشن
 */
export default function PipelineChart({ customers = [], delay = 200 }) {
  const data = useMemo(() => {
    return PIPELINE_STAGES.map((stage) => ({
      name: stage.label,
      key: stage.value,
      count: customers.filter((c) => c.pipelineStage === stage.value).length,
      color: STAGE_COLORS[stage.value] || "#D4A017",
    }));
  }, [customers]);

  const total = data.reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0];
    const pct = total ? Math.round((p.value / total) * 100) : 0;
    return (
      <div className="bg-surface border border-border rounded-xl shadow-card p-2.5 text-xs">
        <p className="font-bold text-content">{label}</p>
        <p className="text-content-muted mt-0.5">
          {fa(p.value)} مشتری ({fa(pct)}٪)
        </p>
      </div>
    );
  };

  return (
    <ScrollAnimate type="fade-up" delay={0}>
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-content">قیف فروش</h3>
            <p className="text-sm text-content-muted mt-0.5">
              تعداد مشتریان در هر مرحله از پایپ‌لاین
            </p>
          </div>
          <div className="text-xs text-content-muted">
            مجموع: <span className="font-bold text-content">{fa(total)}</span>{" "}
            مشتری
          </div>
        </div>

        {total === 0 ? (
          <div className="flex items-center justify-center h-[260px] text-sm text-content-muted">
            داده‌ای موجود نیست
          </div>
        ) : (
          <div className="w-full" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="barGoldGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#D4A017" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "var(--color-text-primary)" }}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "var(--color-surface-muted)", opacity: 0.5 }}
                />
                <Bar
                  dataKey="count"
                  name="تعداد"
                  radius={[0, 8, 8, 0]}
                  barSize={26}
                >
                  {data.map((entry, i) => (
                    <Cell key={`bar-${i}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* خلاصه مراحل پایین نمودار */}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {data.map((d) => (
            <div key={d.key} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: d.color }}
              />
              <span className="text-content-muted truncate">{d.name}</span>
              <span className="font-bold text-content mr-auto">
                {fa(d.count)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ScrollAnimate>
  );
}
