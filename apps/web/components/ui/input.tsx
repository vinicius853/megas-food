'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<
  HTMLInputElement,
  InputProps
>(
  (
    {
      className,
      type = 'text',
      ...props
    },
    ref,
  ) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition-all duration-200',
          'placeholder:text-slate-400',
          'focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/15',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'hover:border-slate-300',
          className,
        )}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'
