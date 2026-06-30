// KanbanColumn — ستون یک مرحله از پایپ‌لاین با قابلیت droppable
import ScrollAnimate from "../common/ScrollAnimate.jsx";
import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import {
  Sparkles,
  Phone,
  Home,
  MessageSquare,
  CheckCircle2,
  XCircle,
  CircleDashed,
} from "lucide-react";
import Badge from "../common/Badge.jsx";
import KanbanCard from "./KanbanCard.jsx";
import { classByColor } from "../../utils/helpers.js";

// نگاشت نام آیکون به کامپوننت (مطابق PIPELINE_STAGES.icon)
const ICONS = {
  Sparkles,
  Phone,
  Home,
  MessageSquare,
  CheckCircle2,
  XCircle,
};

// رنگ‌های نوار بالای ستون
const ACCENTS = {
  info: "bg-blue-400",
  warning: "bg-orange-400",
  gold: "bg-gold-500",
  purple: "bg-purple-400",
  success: "bg-emerald-400",
  error: "bg-red-400",
  gray: "bg-gray-400",
};

/**
 * KanbanColumn
 * props:
 *  - stage: object  (یک آیتم از PIPELINE_STAGES)
 *  - customers: array
 *  - userMap: object  (نقشه id → user)
 *  - isDragDisabled: boolean
 *  - onView: (customer) => void
 */
export default function KanbanColumn({
  stage,
  customers,
  userMap,
  isDragDisabled = false,
  onView,
}) {
  const Icon = ICONS[stage.icon] || CircleDashed;
  const accent = ACCENTS[stage.color] || ACCENTS.gray;

  return (
    <ScrollAnimate type="fade-up" delay={0}>
      <div className="flex flex-col w-[18rem] shrink-0 bg-surface-muted/40 dark:bg-surface-muted/20 rounded-2xl border border-border overflow-hidden">
        {/* هدر ستون */}
        <div className="relative px-3.5 py-3 border-b border-border bg-surface">
          <span
            className={`absolute top-0 right-0 left-0 h-1 ${accent}`}
            aria-hidden="true"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`shrink-0 p-1.5 rounded-lg ${classByColor(stage.color)}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className="text-sm font-semibold text-content truncate"
                title={stage.label}
              >
                {stage.label}
              </span>
            </div>
            <Badge color={stage.color || "gray"} size="sm" className="shrink-0">
              {customers.length}
            </Badge>
          </div>
        </div>

        {/* ناحیه droppable */}
        <Droppable droppableId={stage.value} type="column">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 min-h-[140px] max-h-[calc(100vh-260px)] overflow-y-auto p-2.5 space-y-2.5 transition-colors duration-150 ${
                snapshot.isDraggingOver
                  ? "bg-gold-50/70 dark:bg-gold-900/15"
                  : ""
              }`}
            >
              {customers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-content-muted">
                  <div className="p-2.5 rounded-xl bg-surface-muted text-content-muted mb-2">
                    <Icon className="w-5 h-5 opacity-60" />
                  </div>
                  <span>مشتری‌ای در این مرحله نیست</span>
                </div>
              ) : (
                customers.map((c, idx) => (
                  <KanbanCard
                    key={c.id}
                    customer={c}
                    advisor={c.assignedTo ? userMap[c.assignedTo] : null}
                    index={idx}
                    isDragDisabled={isDragDisabled}
                    onView={onView}
                  />
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </ScrollAnimate>
  );
}
