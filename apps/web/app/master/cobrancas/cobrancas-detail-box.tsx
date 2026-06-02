type DetailBoxProps = {
  label: string
  value: string
}

export function DetailBox({ label, value }: DetailBoxProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-900">{value}</p>
    </div>
  )
}
