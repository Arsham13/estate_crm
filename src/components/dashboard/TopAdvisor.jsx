// TopAdvisor — کارت نمایش برترین مشاور ماه بر اساس تعداد قرارداد و مجموع کمیسیون (فقط برای ادمین)
import ScrollAnimate from "../common/ScrollAnimate.jsx";
import React, { useMemo } from "react";
import { Crown, Trophy, FileText, TrendingUp } from "lucide-react";
import { formatCompactCurrency } from "../../utils/formatters.js";
import Avatar from "../common/Avatar.jsx";
import Badge from "../common/Badge.jsx";

const fa = (n) => Number(n).toLocaleString("fa-IR");

/**
 * TopAdvisor
 * props:
 *  - contracts: آرایه قراردادها (با فیلد advisorId, commission, amount, startDate)
 *  - users: آرایه کاربران برای resolve نام مشاور
 *  - delay: تأخیر انیمیشن
 */
export default function TopAdvisor({
  contracts = [],
  users = [],
  delay = 300,
}) {
  // محاسبه برترین مشاور ماه جاری
  const top = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    // فیلتر قراردادهای ماه جاری (غیر از لغو شده)
    const monthContracts = contracts.filter((c) => {
      const d = new Date(c.startDate || c.createdAt);
      return d >= monthStart && d <= monthEnd && c.status !== "canceled";
    });

    // گروه‌بندی بر اساس advisorId
    const byAdvisor = {};
    monthContracts.forEach((c) => {
      if (!byAdvisor[c.advisorId]) {
        byAdvisor[c.advisorId] = {
          advisorId: c.advisorId,
          count: 0,
          commission: 0,
          amount: 0,
        };
      }
      byAdvisor[c.advisorId].count += 1;
      byAdvisor[c.advisorId].commission += Number(c.commission || 0);
      byAdvisor[c.advisorId].amount += Number(c.amount || 0);
    });

    const arr = Object.values(byAdvisor).sort(
      (a, b) => b.count - a.count || b.commission - a.commission,
    );

    if (arr.length === 0) return null;
    return { ...arr[0], user: users.find((u) => u.id === arr[0].advisorId) };
  }, [contracts, users]);

  // رتبه‌بندی کامل برای نمایش لیست کوچک
  const ranking = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const monthContracts = contracts.filter((c) => {
      const d = new Date(c.startDate || c.createdAt);
      return d >= monthStart && d <= monthEnd && c.status !== "canceled";
    });
    const byAdvisor = {};
    monthContracts.forEach((c) => {
      if (!byAdvisor[c.advisorId]) {
        byAdvisor[c.advisorId] = {
          advisorId: c.advisorId,
          count: 0,
          commission: 0,
        };
      }
      byAdvisor[c.advisorId].count += 1;
      byAdvisor[c.advisorId].commission += Number(c.commission || 0);
    });
    return Object.values(byAdvisor)
      .map((x) => ({ ...x, user: users.find((u) => u.id === x.advisorId) }))
      .sort((a, b) => b.count - a.count || b.commission - a.commission)
      .slice(0, 3);
  }, [contracts, users]);

  return (
    <ScrollAnimate type="fade-up" delay={0}>
      <div className="relative overflow-hidden bg-gradient-to-br from-gold-600 via-gold-700 to-gold-800 text-white rounded-2xl p-5 shadow-card-hover">
        {/* دکوراسیون پس‌زمینه */}
        <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -right-8 -bottom-12 w-48 h-48 rounded-full bg-black/10 blur-2xl pointer-events-none" />

        <div className="relative">
          {/* هدر */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5" />
                <h3 className="text-base font-bold">برترین مشاور ماه</h3>
              </div>
              <p className="text-xs text-gold-100/90">
                بر اساس تعداد قرارداد و کمیسیون
              </p>
            </div>
            <Badge color="gold" size="sm" className="bg-white/20 text-white">
              ماه جاری
            </Badge>
          </div>

          {!top ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gold-100/90">
              <Crown className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">هنوز قراردادی در این ماه ثبت نشده است</p>
            </div>
          ) : (
            <>
              {/* کارت برترین */}
              <div className="flex items-center gap-4 mb-5 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="relative">
                  <Avatar name={top.user?.name || "مشاور"} size="lg" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gold-400 text-gold-900 flex items-center justify-center border-2 border-gold-700">
                    <Crown className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gold-100/90">برترین</p>
                  <p className="text-lg font-bold truncate">
                    {top.user?.name || "نامشخص"}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gold-100">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {fa(top.count)} قرارداد
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {formatCompactCurrency(top.commission)} ت
                    </span>
                  </div>
                </div>
              </div>

              {/* رتبه‌بندی کوتاه */}
              {ranking.length > 1 && (
                <ul className="space-y-1.5">
                  {ranking.slice(1).map((r, idx) => (
                    <li
                      key={r.advisorId}
                      className="flex items-center gap-3 p-2 rounded-lg bg-white/5 text-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold">
                        {fa(idx + 2)}
                      </span>
                      <span className="flex-1 truncate">
                        {r.user?.name || "نامشخص"}
                      </span>
                      <span className="text-gold-100/90">
                        {fa(r.count)} قرارداد
                      </span>
                      <span className="text-gold-100/90">
                        {formatCompactCurrency(r.commission)} ت
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </ScrollAnimate>
  );
}
