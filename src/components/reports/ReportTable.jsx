// ReportTable — جدول sortable کمیسیون به ازای هر قرارداد با فوتر مجموع کمیسیون
import ScrollAnimate from "../common/ScrollAnimate.jsx";
import React, { useMemo } from "react";
import Table from "../common/Table.jsx";
import Badge from "../common/Badge.jsx";
import {
  formatCurrency,
  formatCompactCurrency,
  toJalali,
} from "../../utils/formatters.js";
import { getLabel } from "../../utils/helpers.js";
import { CONTRACT_STATUS } from "../../utils/constants.js";

const fa = (n) => Number(n || 0).toLocaleString("fa-IR");

// رنگ بج برای وضعیت قرارداد
const STATUS_COLOR = {
  active: "success",
  expired: "warning",
  canceled: "error",
};

/**
 * ReportTable
 * props:
 *  - contracts: آرایه قراردادها
 *  - customerMap: نقشه customerId → customer
 *  - userMap: نقشه advisorId → user
 *  - delay: تأخیر انیمیشن (ms)
 */
export default function ReportTable({
  contracts = [],
  customerMap = {},
  userMap = {},
  delay = 400,
}) {
  // محاسبه مجموع کمیسیون
  const totalCommission = useMemo(() => {
    return contracts.reduce((s, c) => s + Number(c.commission || 0), 0);
  }, [contracts]);

  // آماده‌سازی ردیف‌ها — اضافه کردن فیلدهای resolve‌شده برای مرتب‌سازی صحیح
  const rows = useMemo(() => {
    return contracts.map((c) => ({
      ...c,
      _customerName: customerMap[c.customerId]?.name || "—",
      _advisorName: userMap[c.advisorId]?.name || "—",
    }));
  }, [contracts, customerMap, userMap]);

  // ستون‌های جدول
  const columns = useMemo(
    () => [
      {
        key: "code",
        header: "کد قرارداد",
        render: (row) => (
          <span className="font-mono text-gold-700 dark:text-gold-400 font-medium">
            {row.code || "—"}
          </span>
        ),
      },
      {
        key: "_customerName",
        header: "مشتری",
        render: (row) => (
          <span className="text-content font-medium">{row._customerName}</span>
        ),
      },
      {
        key: "_advisorName",
        header: "مشاور",
        render: (row) => (
          <span className="text-content-muted">{row._advisorName}</span>
        ),
      },
      {
        key: "amount",
        header: "مبلغ قرارداد",
        render: (row) => (
          <span className="text-content">
            {row.amount ? `${formatCompactCurrency(row.amount)} ت` : "—"}
          </span>
        ),
      },
      {
        key: "commission",
        header: "کمیسیون",
        render: (row) => (
          <span className="text-gold-700 dark:text-gold-400 font-semibold">
            {row.commission ? `${formatCurrency(row.commission)} ت` : "—"}
          </span>
        ),
      },
      {
        key: "startDate",
        header: "تاریخ شروع",
        render: (row) => (
          <span className="text-content-muted text-xs">
            {toJalali(row.startDate)}
          </span>
        ),
      },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => (
          <Badge color={STATUS_COLOR[row.status] || "gray"} dot>
            {getLabel(CONTRACT_STATUS, row.status)}
          </Badge>
        ),
      },
    ],
    [],
  );

  if (!contracts || contracts.length === 0) {
    return (
      <ScrollAnimate type="fade-up" delay={0}>
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
          <h3 className="text-base font-bold text-content mb-4">
            کمیسیون به ازای هر قرارداد
          </h3>
          <div className="flex items-center justify-center text-sm text-content-muted py-12">
            قراردادی در بازه انتخاب‌شده وجود ندارد
          </div>
        </div>
      </ScrollAnimate>
    );
  }

  return (
    <ScrollAnimate type="fade-up" delay={0}>
      <div className="space-y-3">
        {/* عنوان بخش */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h3 className="text-base font-bold text-content">
              کمیسیون به ازای هر قرارداد
            </h3>
            <p className="text-sm text-content-muted mt-0.5">
              مجموع {fa(contracts.length)} قرارداد در بازه انتخاب‌شده
            </p>
          </div>
        </div>

        {/* جدول */}
        <Table
          columns={columns}
          data={rows}
          rowKey="id"
          initialSort={{ field: "startDate", direction: "desc" }}
        />

        {/* فوتر مجموع کمیسیون */}
        <div className="surface-card p-4 bg-surface-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm text-content-muted">مجموع کمیسیون</p>
              <p className="text-xs text-content-muted mt-0.5">
                از {fa(contracts.length)} قرارداد در بازه انتخاب‌شده
              </p>
            </div>
            <p className="text-xl font-bold text-gold-700 dark:text-gold-400 sm:text-left">
              {formatCurrency(totalCommission)} ت
            </p>
          </div>
        </div>
      </div>
    </ScrollAnimate>
  );
}
