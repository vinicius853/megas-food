import * as React from 'react'

import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'default' | 'narrow' | 'full'
}

export function PageContainer({
  children,
  className,
  size = 'default',
}: PageContainerProps) {
  const widths = {
    narrow: 'max-w-4xl',
    default: 'max-w-[1600px]',
    full: 'max-w-none',
  } as const

  return (
    <div
      className={cn(
        'mx-auto w-full px-5 py-5 md:px-8 md:py-7',
        widths[size],
        className,
      )}
    >
      {children}
    </div>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-orange-700">
          Megas Food
        </div>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
          {title}
        </h1>

        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
