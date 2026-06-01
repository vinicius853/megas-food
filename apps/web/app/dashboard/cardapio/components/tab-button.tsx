import type {
  LucideIcon,
} from 'lucide-react'
import type {
  ReactNode,
} from 'react'

export function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
        active
          ? 'bg-orange-600 text-white shadow-lg'
          : 'bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-600'
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}
