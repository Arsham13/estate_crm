// TodayTasks — لیست وظایف امروز با امکان تیک زدن به‌عنوان انجام‌شده (فراخوانی taskService.update)
import ScrollAnimate from "../common/ScrollAnimate.jsx";
import React, { useState } from "react";
import { CheckCircle2, Circle, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { taskService } from "../../services/taskService.js";
import { TASK_PRIORITY, TASK_STATUS } from "../../utils/constants.js";
import { getColor, getLabel } from "../../utils/helpers.js";
import { toJalaliTime } from "../../utils/formatters.js";
import Badge from "../common/Badge.jsx";

const fa = (n) => Number(n).toLocaleString("fa-IR");

/**
 * TodayTasks
 * props:
 *  - tasks: آرایه وظایف (همه — نه فقط امروز)
 *  - delay: تأخیر انیمیشن
 *  - onChanged: کال‌بک اختیاری برای اطلاع از تغییر
 */
export default function TodayTasks({ tasks = [], delay = 400, onChanged }) {
  const [updatingId, setUpdatingId] = useState(null);
  const [localTasks, setLocalTasks] = useState(tasks);

  // sync با props
  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // فیلتر وظایف امروز (با مقایسه-only-date)
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const todayTasks = React.useMemo(() => {
    return localTasks
      .filter((t) => {
        const d = new Date(t.dueDate);
        return d.toISOString().slice(0, 10) === todayStr;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [localTasks, todayStr]);

  // تغییر وضعیت به انجام‌شده
  const handleToggle = async (task) => {
    if (task.status === "done") return;
    setUpdatingId(task.id);
    try {
      await taskService.update(task.id, { status: "done" });
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "done" } : t)),
      );
      toast.success("وظیفه انجام شد");
      onChanged?.();
    } catch (err) {
      toast.error(err.message || "خطا در بروزرسانی وظیفه");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <ScrollAnimate type="fade-up" delay={0}>
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-card h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-content">وظایف امروز</h3>
            <p className="text-sm text-content-muted mt-0.5">
              {fa(todayTasks.length)} وظیفه برای امروز
            </p>
          </div>
          <Link
            to="/tasks"
            className="press-effect cursor-pointer text-xs text-gold-700 dark:text-gold-400 hover:underline flex items-center gap-1"
          >
            همه وظایف
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {todayTasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
            <p className="text-sm text-content-muted">
              وظیفه‌ای برای امروز نیست
            </p>
          </div>
        ) : (
          <ul className="space-y-2 flex-1 max-h-80 overflow-y-auto pr-1">
            {todayTasks.map((task) => {
              const isDone = task.status === "done";
              const priorityColor = getColor(
                TASK_PRIORITY,
                task.priority,
                "gray",
              );
              return (
                <li
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                    isDone
                      ? "border-border bg-surface-muted opacity-70"
                      : "border-border hover:border-gold-400 hover:bg-surface-muted"
                  }`}
                >
                  {/* چک‌باکس */}
                  <button
                    type="button"
                    onClick={() => handleToggle(task)}
                    disabled={isDone || updatingId === task.id}
                    aria-label={
                      isDone ? "انجام شده" : "علامت‌گذاری به‌عنوان انجام‌شده"
                    }
                    className={`press-effect cursor-pointer shrink-0 mt-0.5 ${
                      isDone
                        ? "text-emerald-500"
                        : "text-content-muted hover:text-gold-600"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  {/* اطلاعات */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium text-content ${
                        isDone ? "line-through" : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge color={priorityColor} size="sm" dot>
                        {getLabel(TASK_PRIORITY, task.priority)}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-content-muted">
                        <Clock className="w-3 h-3" />
                        {toJalaliTime(task.dueDate)}
                      </span>
                      {task.status === "in_progress" && (
                        <Badge color="info" size="sm">
                          {getLabel(TASK_STATUS, task.status)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ScrollAnimate>
  );
}
