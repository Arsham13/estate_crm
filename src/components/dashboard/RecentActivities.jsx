// RecentActivities — لیست ۵ فعالیت اخیر با نام کاربر، توضیح و زمان نسبی
import ScrollAnimate from "../common/ScrollAnimate.jsx";
import React, { useMemo } from "react";
import {
  UserPlus,
  FileText,
  Home,
  CheckSquare,
  CalendarCheck,
  Edit3,
  Activity as ActivityIcon,
} from "lucide-react";
import { timeAgo } from "../../utils/formatters.js";
import Avatar from "../common/Avatar.jsx";

// نگاشت اکشن به آیکون و رنگ
const ACTION_META = {
  created_customer: {
    icon: UserPlus,
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  updated_customer: {
    icon: Edit3,
    color: "text-sky-500",
    bg: "bg-sky-100 dark:bg-sky-900/30",
  },
  created_property: {
    icon: Home,
    color: "text-gold-600",
    bg: "bg-gold-100 dark:bg-gold-900/30",
  },
  updated_property: {
    icon: Edit3,
    color: "text-sky-500",
    bg: "bg-sky-100 dark:bg-sky-900/30",
  },
  closed_contract: {
    icon: FileText,
    color: "text-purple-500",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  completed_task: {
    icon: CheckSquare,
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  scheduled_visit: {
    icon: CalendarCheck,
    color: "text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  created_visit: {
    icon: CalendarCheck,
    color: "text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
};

const fallback = {
  icon: ActivityIcon,
  color: "text-content-muted",
  bg: "bg-surface-muted",
};

/**
 * RecentActivities
 * props:
 *  - activities: آرایه فعالیت‌ها
 *  - users: آرایه کاربران برای resolve کردن نام
 *  - delay: تأخیر انیمیشن
 */
export default function RecentActivities({
  activities = [],
  users = [],
  delay = 500,
}) {
  // ۵ فعالیت اخیر — به‌ترتیب createdAt نزولی
  const recent = useMemo(() => {
    return [...activities]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [activities]);

  // resolve کردن نام کاربر
  const resolveUser = (userId) => {
    const u = users.find((x) => x.id === userId);
    return u ? u.name : "کاربر ناشناس";
  };

  return (
    <ScrollAnimate type="fade-up" delay={0}>
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-card h-full flex flex-col">
        <div className="mb-4">
          <h3 className="text-base font-bold text-content">فعالیت‌های اخیر</h3>
          <p className="text-sm text-content-muted mt-0.5">
            آخرین رویدادهای سیستم
          </p>
        </div>

        {recent.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-content-muted py-8">
            فعالیتی ثبت نشده است
          </div>
        ) : (
          <ul className="space-y-4 flex-1 max-h-80 overflow-y-auto pr-1">
            {recent.map((act) => {
              const meta = ACTION_META[act.action] || fallback;
              const Icon = meta.icon;
              return (
                <li key={act.id} className="flex items-start gap-3">
                  {/* آواتار کاربر */}
                  <Avatar name={resolveUser(act.userId)} size="sm" />

                  {/* آیکون اکشن به‌عنوان نشانگر نوع فعالیت */}
                  <div
                    className={`shrink-0 -mr-2 mt-3 w-5 h-5 rounded-full flex items-center justify-center ${meta.bg} ${meta.color} border-2 border-surface`}
                    title={act.action}
                  >
                    <Icon className="w-3 h-3" />
                  </div>

                  {/* متن فعالیت */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-content leading-relaxed">
                      <span className="font-semibold">
                        {resolveUser(act.userId)}
                      </span>{" "}
                      <span className="text-content-muted">
                        {act.description}
                      </span>
                    </p>
                    <p className="text-xs text-content-muted mt-0.5">
                      {timeAgo(act.createdAt)}
                    </p>
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
