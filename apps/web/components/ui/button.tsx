'use client'

import * as React from 'react'

import { Slot } from '@radix-ui/react-slot'

import {
  cva,
  type VariantProps,
} from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-bold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-slate-900 text-white shadow-lg hover:bg-slate-800',

        primary:
          'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-[0_10px_30px_rgba(234,88,12,0.28)] hover:brightness-110',

        secondary:
          'bg-slate-100 text-slate-900 hover:bg-slate-200',

        outline:
          'border border-slate-200 bg-white text-slate-900 shadow-sm hover:border-orange-200 hover:bg-orange-50',

        ghost:
          'text-slate-700 hover:bg-slate-100',

        destructive:
          'bg-red-600 text-white shadow-lg hover:bg-red-700',

        link:
          'text-orange-600 underline-offset-4 hover:underline',
      },

      size: {
        sm: 'h-9 px-4 text-xs',

        md: 'h-11 px-5 text-sm',

        lg: 'h-13 px-7 text-base',

        icon: 'h-11 w-11',
      },
    },

    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={cn(
          buttonVariants({
            variant,
            size,
          }),
          className,
        )}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'

export { buttonVariants }
