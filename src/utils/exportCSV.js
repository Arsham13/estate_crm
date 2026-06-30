// خروجی گرفتن CSV از آرایه آبجکت‌ها

// تبدیل مقدار به رشته امن برای CSV
function escapeCell(value) {
  if (value === null || value === undefined) return ''
  let str = String(value)
  // اگر شامل کاما، کوتیشن یا newline است، در کوتیشن قرار بده
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// تبدیل آرایه آبجکت‌ها به CSV
export function toCSV(rows, columns) {
  // columns: [{ key, label }]
  if (!rows || rows.length === 0) return ''
  const header = columns.map((c) => escapeCell(c.label)).join(',')
  const body = rows
    .map((row) => columns.map((c) => escapeCell(row[c.key])).join(','))
    .join('\n')
  return `${header}\n${body}`
}

// دانلود فایل CSV با پشتیبانی از فارسی (UTF-8 BOM)
export function downloadCSV(rows, columns, filename) {
  const csv = toCSV(rows, columns)
  // افزودن BOM برای پشتیبانی صحیح از UTF-8 در اکسل
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `export-${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
