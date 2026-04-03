import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        gradient: 'rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold border-none shadow-lg hover:opacity-90 dark:bg-none dark:bg-[#00D4FF] dark:text-black dark:font-semibold dark:shadow-none dark:hover:shadow-[0_0_20px_4px_rgba(0,212,255,0.35)] dark:hover:opacity-100 dark:hover:brightness-105 transition-all duration-200',
        blue: 'bg-[var(--blue)] text-white hover:bg-[var(--blue)]/90 shadow-md',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-white/10 dark:bg-transparent dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-foreground dark:hover:border-white/20',
        secondary:
          'rounded-full bg-transparent text-gray-600 border border-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:bg-transparent dark:text-gray-400 dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-foreground dark:hover:border-white/20',
        ghost:
          'hover:bg-gray-100 hover:text-gray-900 text-gray-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
