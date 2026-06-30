// CustomerProfile — مودال نمایش جزئیات مشتری به‌همراه خلاصه بازدید/قرارداد/وظیفه و لیست وظایف مرتبط
import ScrollAnimate from "../common/ScrollAnimate.jsx";
import React, { useEffect, useState } from "react";
import {
  User as UserIcon,
  Phone,
  Mail,
  Tag,
  Link2,
  Wallet,
  CalendarClock,
  StickyNote,
  ClipboardList,
  FileText,
  Eye,
  CheckSquare,
  AlertCircle,
} from "lucide-react";
import Modal from "../common/Modal.jsx";
import Card, { CardHeader } from "../common/Card.jsx";
import Badge from "../common/Badge.jsx";
import LoadingSpinner from "../common/LoadingSpinner.jsx";
import EmptyState from "../common/EmptyState.jsx";
import { visitService } from "../../services/visitService.js";
import { contractService } from "../../services/contractService.js";
import { taskService } from "../../services/taskService.js";
import { authService } from "../../services/authService.js";
import {
  CUSTOMER_TYPES,
  CUSTOMER_SOURCES,
  PIPELINE_STAGES,
  TASK_PRIORITY,
  TASK_STATUS,
} from "../../utils/constants.js";
import {
  formatCurrency,
  toJalali,
  toJalaliDateTime,
} from "../../utils/formatters.js";
import { getLabel } from "../../utils/helpers.js";

const fa = (n) => Number(n || 0).toLocaleString("fa-IR");

// ردیف اطلاعات پایه
function InfoRow({ icon: Icon, label, value, dir }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="shrink-0 p-1.5 rounded-lg bg-surface-muted text-content-muted">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-content-muted">{label}</p>
        <p
          className={`text-sm font-medium text-content break-words ${dir === "ltr" ? "text-right" : ""}`}
          dir={dir}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// کارت شمارش خلاصه
function CountCard({ icon: Icon, label, count, color = "gold" }) {
  const colorMap = {
    gold: "text-gold-600 bg-gold-100 dark:bg-gold-900/30 dark:text-gold-300",
    info: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300",
    success:
      "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300",
    purple:
      "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300",
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
      <div className={`shrink-0 p-2 rounded-lg ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-content-muted">{label}</p>
        <p className="text-lg font-bold text-content leading-tight">
          {fa(count)}
        </p>
      </div>
    </div>
  );
}

/**
 * CustomerProfile
 * props:
 *  - open: boolean
 *  - onClose: () => void
 *  - customer: object | null
 *  - onEdit?: (customer) => void  (دکمه ویرایش اختیاری)
 *  - canEdit?: boolean
 */
export default function CustomerProfile({
  open,
  onClose,
  customer,
  onEdit,
  canEdit = false,
}) {
  const [visits, setVisits] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [advisor, setAdvisor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !customer?.id) return;
    let active = true;
    setLoading(true);
    setError(null);

    const cid = customer.id;
    Promise.all([
      visitService.getAll({ customerId: cid, _limit: 1000 }).catch(() => []),
      contractService.getAll({ customerId: cid, _limit: 1000 }).catch(() => []),
      taskService.getAll({ customerId: cid, _limit: 1000 }).catch(() => []),
      customer.assignedTo
        ? authService.getById(customer.assignedTo).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([v, c, t, adv]) => {
        if (!active) return;
        setVisits(Array.isArray(v) ? v : []);
        setContracts(Array.isArray(c) ? c : []);
        setTasks(Array.isArray(t) ? t : []);
        setAdvisor(adv);
      })
      .catch((err) => {
        if (active) setError(err.message || "خطا در دریافت اطلاعات");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, customer]);

  const pipelineStage = customer
    ? PIPELINE_STAGES.find((s) => s.value === customer.pipelineStage)
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="پروفایل مشتری"
      description={customer?.name || ""}
      footer={
        canEdit && onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(customer)}
            className="press-effect inline-flex items-center gap-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white px-4 h-10 text-sm font-medium cursor-pointer transition-colors"
          >
            ویرایش مشتری
          </button>
        ) : undefined
      }
    >
      {!customer ? null : loading ? (
        <LoadingSpinner fullPage label="در حال بارگذاری اطلاعات…" />
      ) : error ? (
        <EmptyState icon={AlertCircle} title="خطا" description={error} />
      ) : (
        <div className="space-y-5">
          {/* خلاصه شمارش */}
          <ScrollAnimate type="fade-up" delay={0}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CountCard
                icon={Eye}
                label="بازدیدها"
                count={visits.length}
                color="info"
              />
              <CountCard
                icon={FileText}
                label="قراردادها"
                count={contracts.length}
                color="success"
              />
              <CountCard
                icon={CheckSquare}
                label="وظایف"
                count={tasks.length}
                color="purple"
              />
              <CountCard
                icon={ClipboardList}
                label="وظایف باز"
                count={tasks.filter((t) => t.status !== "done").length}
                color="gold"
              />
            </div>
          </ScrollAnimate>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* اطلاعات پایه */}
            <Card padding="p-5" animate="fade-up" animateDelay={100}>
              <CardHeader
                title="اطلاعات پایه"
                icon={<UserIcon className="w-5 h-5" />}
              />
              <div className="divide-y divide-border">
                <InfoRow
                  icon={UserIcon}
                  label="نام کامل"
                  value={customer.name}
                />
                <InfoRow
                  icon={Phone}
                  label="شماره موبایل"
                  value={customer.phone}
                  dir="ltr"
                />
                <InfoRow
                  icon={Mail}
                  label="ایمیل"
                  value={customer.email}
                  dir="ltr"
                />
                <InfoRow
                  icon={Tag}
                  label="نوع مشتری"
                  value={
                    <Badge color="gray">
                      {getLabel(CUSTOMER_TYPES, customer.type)}
                    </Badge>
                  }
                />
                <InfoRow
                  icon={Link2}
                  label="منبع آشنایی"
                  value={
                    <Badge color="info">
                      {getLabel(CUSTOMER_SOURCES, customer.source)}
                    </Badge>
                  }
                />
                <InfoRow
                  icon={Wallet}
                  label="بودجه"
                  value={`${formatCurrency(customer.budget)} ت`}
                />
                {pipelineStage && (
                  <InfoRow
                    icon={ClipboardList}
                    label="مرحله پایپ‌لاین"
                    value={
                      <Badge color={pipelineStage.color || "gray"} dot>
                        {pipelineStage.label}
                      </Badge>
                    }
                  />
                )}
                <InfoRow
                  icon={UserIcon}
                  label="مشاور مسئول"
                  value={advisor?.name || "—"}
                />
                <InfoRow
                  icon={CalendarClock}
                  label="تاریخ ثبت"
                  value={toJalaliDateTime(customer.createdAt)}
                />
              </div>
            </Card>

            {/* یادداشت + لیست وظایف */}
            <div className="space-y-5">
              <Card padding="p-5" animate="fade-up" animateDelay={200}>
                <CardHeader
                  title="یادداشت"
                  icon={<StickyNote className="w-5 h-5" />}
                />
                {customer.note ? (
                  <p className="text-sm text-content leading-7 whitespace-pre-wrap bg-surface-muted/50 rounded-xl p-3">
                    {customer.note}
                  </p>
                ) : (
                  <p className="text-sm text-content-muted italic">
                    یادداشتی ثبت نشده است
                  </p>
                )}
              </Card>

              <Card padding="p-5" animate="fade-up" animateDelay={300}>
                <CardHeader
                  title="وظایف مرتبط"
                  subtitle={`${fa(tasks.length)} وظیفه`}
                  icon={<CheckSquare className="w-5 h-5" />}
                />
                {tasks.length === 0 ? (
                  <p className="text-sm text-content-muted py-4 text-center">
                    وظیفه‌ای برای این مشتری ثبت نشده است
                  </p>
                ) : (
                  <ul className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {tasks.map((t) => {
                      const priority = TASK_PRIORITY.find(
                        (p) => p.value === t.priority,
                      );
                      const status = TASK_STATUS.find(
                        (s) => s.value === t.status,
                      );
                      return (
                        <li
                          key={t.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-muted/40 border border-border"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-content truncate">
                              {t.title}
                            </p>
                            <p className="text-xs text-content-muted mt-0.5">
                              سررسید: {toJalali(t.dueDate)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {priority && (
                              <Badge color={priority.color || "gray"} size="sm">
                                {priority.label}
                              </Badge>
                            )}
                            {status && (
                              <Badge color={status.color || "gray"} size="sm">
                                {status.label}
                              </Badge>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
