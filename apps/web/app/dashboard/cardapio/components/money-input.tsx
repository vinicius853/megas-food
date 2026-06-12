'use client'

import {
  useEffect,
  useState,
} from 'react'

import { formatMoneyInput } from '../types/menu-management'

export function MoneyInput({
  value,
  onChange,
  disabled = false,
  fluid = false,
}: {
  value: string | number
  onChange: (value: string) => void
  disabled?: boolean
  fluid?: boolean
}) {
  const [draft, setDraft] = useState(String(value ?? '0,00'))

  useEffect(() => {
    setDraft(String(value ?? '0,00'))
  }, [value])

  function handleFocus(
    event: React.FocusEvent<HTMLInputElement>,
  ) {
    const valueText = String(draft).trim()

    if (
      valueText === '0' ||
      valueText === '0,00' ||
      valueText === '0.00'
    ) {
      setDraft('')
      return
    }

    event.currentTarget.select()
  }

  function handleBlur() {
    const formatted = formatMoneyInput(draft)

    setDraft(formatted)
    onChange(formatted)
  }

  return (
    <div
      className={`flex h-11 w-full min-w-0 items-center rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/15 ${
        fluid ? '' : 'mx-auto max-w-[112px]'
      } ${disabled ? 'bg-slate-100 opacity-60' : ''}`}
    >
      <span className="shrink-0 text-xs font-black text-slate-400">
        R$
      </span>

      <input
        value={draft}
        disabled={disabled}
        onFocus={handleFocus}
        onChange={(event) => {
          setDraft(event.target.value)
          onChange(event.target.value)
        }}
        onBlur={handleBlur}
        inputMode="decimal"
        placeholder="0,00"
        className="h-full min-w-0 flex-1 bg-transparent px-1 text-center text-sm font-black text-slate-900 outline-none"
      />
    </div>
  )
}

