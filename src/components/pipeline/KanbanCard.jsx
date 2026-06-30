// KanbanCard — کارت مشتری در ستون پایپ‌لاین با قابلیت drag & drop
import ScrollAnimate from "../common/ScrollAnimate.jsx";
import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Eye, Wallet, User as UserIcon, Clock } from "lucide-react";
import Badge from "../common/Badge.jsx";
import Avatar from "../common/Avatar.jsx";
import { CUSTOMER_TYPES } from "../../utils/constants.js";
import { formatCompactCurrency, timeAgo } from "../../utils/formatters.js";
import { getColor, getLabel } from "../../utils/helpers.js";

/**
 * KanbanCard
 * props:
 *  - customer: object  (رکورد مشتری با فیلد lastActivityAt اختیاری)
 *  - advisor: object | null  (کاربر محول‌شده)
 *  - index: number  (موقعیت در ستون — لازم برای @hello-pangea/dnd)
 *  - isDragDisabled: boolean  (مثلاً برای assistant read-only)
 *  - onView: (customer) => void  (باز کردن CustomerProfile)
 */
export default function KanbanCard({
  customer,
  advisor,
  index,
  isDragDisabled = false,
  onView,
}) {
  const stageDelay = Math.min((index % 8) * 60, 360);

  return (
    <Draggable
      draggableId={String(customer.id)}
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => (
        <ScrollAnimate type="fade-up" delay={0}>
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`group relative bg-surface border border-border rounded-2xl p-3.5 shadow-sm transition-shadow duration-150 ${
              snapshot.isDragging
                ? "shadow-xl ring-2 ring-gold-500/40 z-50"
                : "hover:shadow-card-hover"
            } ${isDragDisabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
          >
            {/* نوار رنگی بالای کارت بر اساس نوع مشتری */}
            <span
              className={`absolute top-0 right-0 left-0 h-1 rounded-t-2xl ${
                customer.type === "buyer"
                  ? "bg-emerald-400/70"
                  : customer.type === "seller"
                    ? "bg-purple-400/70"
                    : customer.type === "tenant"
                      ? "bg-blue-400/70"
                      : customer.type === "landlord"
                        ? "bg-orange-400/70"
                        : "bg-gray-300/70"
              }`}
              aria-hidden="true"
            />

            {/* هدر: avatar + name + type badge + view button */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar name={customer.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-content truncate">
                    {customer.name}
                  </p>
                  <Badge
                    color={getColor(CUSTOMER_TYPES, customer.type, "gray")}
                    size="sm"
                    className="mt-0.5"
                  >
                    {getLabel(CUSTOMER_TYPES, customer.type)}
                  </Badge>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(customer);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="press-effect shrink-0 p-1.5 rounded-lg text-content-muted hover:text-gold-700 hover:bg-gold-50 dark:hover:bg-gold-900/20 cursor-pointer transition-colors"
                title="مشاهده پروفایل"
                aria-label={`مشاهده پروفایل ${customer.name}`}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* اطلاعات: بودجه و مشاور */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <Wallet className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                <span className="font-semibold text-content truncate">
                  {formatCompactCurrency(customer.budget)}
                </span>
                <span className="text-content-muted shrink-0">ت</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <UserIcon className="w-3.5 h-3.5 text-content-muted shrink-0" />
                <span
                  className="text-content-muted truncate"
                  title={advisor?.name || ""}
                >
                  {advisor?.name || "بدون مشاور"}
                </span>
              </div>
            </div>

            {/* آخرین فعالیت */}
            <div className="mt-2.5 pt-2.5 border-t border-border flex items-center gap-1.5 text-[11px] text-content-muted">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {timeAgo(customer.lastActivityAt || customer.createdAt)}
              </span>
            </div>
          </div>
        </ScrollAnimate>
      )}
    </Draggable>
  );
}
