type DetailItemProps = {
  label: string
  value: string
}

export function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</p>
    </div>
  )
}
