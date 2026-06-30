// TopProperties — لیست ۳ ملک پربازدید همراه با تعداد بازدید، آدرس و قیمت
import ScrollAnimate from "../common/ScrollAnimate.jsx";
import React, { useMemo } from "react";
import { Eye, MapPin, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCompactCurrency } from "../../utils/formatters.js";
import { PROPERTY_TYPES, DEAL_TYPES } from "../../utils/constants.js";
import { getLabel } from "../../utils/helpers.js";
import Badge from "../common/Badge.jsx";

const fa = (n) => Number(n).toLocaleString("fa-IR");

/**
 * TopProperties
 * props:
 *  - properties: آرایه ملک‌ها
 *  - delay: تأخیر انیمیشن
 */
export default function TopProperties({ properties = [], delay = 300 }) {
  // ۳ ملک پربازدید
  const top = useMemo(() => {
    return [...properties]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 3);
  }, [properties]);

  return (
    <ScrollAnimate type="fade-up" delay={0}>
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-card h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-content">
              پربازدیدترین ملک‌ها
            </h3>
            <p className="text-sm text-content-muted mt-0.5">
              بر اساس تعداد بازدید
            </p>
          </div>
          <Link
            to="/properties"
            className="press-effect cursor-pointer text-xs text-gold-700 dark:text-gold-400 hover:underline flex items-center gap-1"
          >
            مشاهده همه
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {top.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-content-muted py-8">
            ملکی یافت نشد
          </div>
        ) : (
          <ul className="space-y-3 flex-1">
            {top.map((p, idx) => (
              <li key={p.id}>
                <Link
                  to={`/properties?id=${p.id}`}
                  className="press-effect cursor-pointer flex items-start gap-3 p-3 rounded-xl border border-border hover:border-gold-400 hover:bg-surface-muted transition-all duration-200 group"
                >
                  {/* رتبه */}
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 flex items-center justify-center text-sm font-bold">
                    {fa(idx + 1)}
                  </div>

                  {/* اطلاعات */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-content truncate">
                        {p.title || getLabel(PROPERTY_TYPES, p.type)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-content-muted mb-2">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {p.address || p.district || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge color="gold" size="sm">
                        {getLabel(DEAL_TYPES, p.dealType)}
                      </Badge>
                      <Badge color="gray" size="sm">
                        {getLabel(PROPERTY_TYPES, p.type)}
                      </Badge>
                    </div>
                  </div>

                  {/* قیمت + بازدید */}
                  <div className="shrink-0 text-left space-y-1.5">
                    <p className="text-sm font-bold text-content whitespace-nowrap">
                      {p.price > 0
                        ? `${formatCompactCurrency(p.price)} ت`
                        : "توافقی"}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-xs text-content-muted">
                      <Eye className="w-3 h-3" />
                      <span>{fa(p.viewCount || 0)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ScrollAnimate>
  );
}
