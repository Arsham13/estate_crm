import React, { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react'
import { sortByField } from '../../utils/helpers.js'

/**
 * جدول قابل مرتب‌سازی
 * - با کلیک روی هر ستون (که sortable=true است) مرتب می‌شود
 * - آیکون جهت مرتب‌سازی نمایش داده می‌شود
 * - افکت hover و active روی ردیف‌ها و هدر
 * - حالت خالی (emptyState)
 *
 * Props:
 *   columns: [{ key, header, sortable=true, render?(row), className? }]
 *   data: array of rows
 *   rowKey: function | string  (پیش‌فرض: id)
 *   onRowClick?: function
 *   emptyState?: ReactNode
 *   initialSort?: { field, direction: 'asc'|'desc' }
 */
export default function Table({
  columns = [],
  data = [],
  rowKey = 'id',
  onRowClick,
  emptyState,
  initialSort,
  className = '',
}) {
  const [sortField, setSortField] = useState(initialSort?.field || null)
  const [sortDir, setSortDir] = useState(initialSort?.direction || 'asc')

  const sortedData = useMemo(() => {
    if (!sortField) return data
    return sortByField(data, sortField, sortDir)
  }, [data, sortField, sortDir])

  // پیش‌فرض: همه ستون‌ها sortable هستند مگر اینکه sortable: false صریحاً تنظیم شده باشد
  const isSortable = (col) => col.sortable !== false

  const handleSort = (col) => {
    if (!isSortable(col)) return
    if (sortField === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(col.key)
      setSortDir('asc')
    }
  }

  const getRowId = (row, idx) => {
    if (typeof rowKey === 'function') return rowKey(row)
    return row[rowKey] ?? idx
  }

  const SortIcon = ({ col }) => {
    if (!isSortable(col)) return null
    if (sortField !== col.key) return <ArrowUpDown className="w-3.5 h-3.5 text-content-muted/60" />
    return sortDir === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-gold-600" />
      : <ArrowDown className="w-3.5 h-3.5 text-gold-600" />
  }

  if (!data || data.length === 0) {
    return (
      <div className="surface-card">
        {emptyState || (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="w-12 h-12 text-content-muted/40 mb-3" />
            <p className="text-content-muted">داده‌ای برای نمایش وجود ندارد</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${className}`}>
          <thead>
            <tr className="bg-surface-muted/50 border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-right font-semibold text-content whitespace-nowrap ${isSortable(col) ? 'cursor-pointer hover:bg-surface-muted transition-colors press-effect' : ''} ${col.headerClassName || ''}`}
                  onClick={isSortable(col) ? () => handleSort(col) : undefined}
                  title={isSortable(col) ? 'برای مرتب‌سازی کلیک کنید' : undefined}
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>{col.header}</span>
                    <SortIcon col={col} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr
                key={getRowId(row, idx)}
                className={`border-b border-border last:border-0 transition-colors hover:bg-surface-muted/40 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-content align-middle ${col.className || ''}`}>
                    {col.render ? col.render(row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
