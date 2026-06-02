type DiagnosticBoxProps = {
  label: string
  value: string
  helper: string
  tone: 'success' | 'warning' | 'danger' | 'default'
}

export function DiagnosticBox({
  label,
  value,
  helper,
  tone,
}: DiagnosticBoxProps) {
  const toneClassName = {
    success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    warning: 'border-orange-100 bg-orange-50 text-orange-700',
    danger: 'border-red-100 bg-red-50 text-red-700',
    default: 'border-slate-100 bg-slate-50 text-slate-700',
  }[tone]

  return (
    <div className={`rounded-2xl border p-4 ${toneClassName}`}>
      <p className="text-xs font-black uppercase opacity-75">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs font-semibold opacity-80">
        {helper}
      </p>
    </div>
  )
}
