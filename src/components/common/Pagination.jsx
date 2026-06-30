import React from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'

/**
 * Pagination ساده
 */
export default function Pagination({ page, totalPages, onChange, totalItems = 0, pageSize = 10 }) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  // تولید شماره صفحات برای نمایش (حداکثر ۵ صفحه)
  const getPages = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      <p className="text-xs text-content-muted">
        نمایش {from.toLocaleString('fa-IR')} تا {to.toLocaleString('fa-IR')} از {totalItems.toLocaleString('fa-IR')} رکورد
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="press-effect p-2 rounded-lg border border-border text-content hover:bg-surface-muted cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          aria-label="صفحه قبل"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {getPages().map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`press-effect min-w-9 h-9 px-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              p === page
                ? 'bg-gold-600 text-white'
                : 'border border-border text-content hover:bg-surface-muted'
            }`}
          >
            {p.toLocaleString('fa-IR')}
          </button>
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="press-effect p-2 rounded-lg border border-border text-content hover:bg-surface-muted cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          aria-label="صفحه بعد"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
