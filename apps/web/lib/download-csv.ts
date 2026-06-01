'use client'

export function downloadCsv(
  filename: string,
  rows: Array<Record<string, string | number | boolean | null | undefined>>,
) {
  if (!rows.length) {
    return
  }

  const headers = Object.keys(rows[0])
  const escapeCell = (value: string | number | boolean | null | undefined) => {
    const text = String(value ?? '')

    return `"${text.replace(/"/g, '""')}"`
  }

  const csv = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(',')),
  ].join('\n')

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
