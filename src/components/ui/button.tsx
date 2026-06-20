import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent border border-white text-white hover:bg-white hover:text-black uppercase tracking-bugatti-mono font-mono rounded-full",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full",
        outline:
          "border border-white/30 bg-transparent text-white hover:bg-white hover:text-black uppercase tracking-bugatti-mono font-mono rounded-full",
        secondary:
          "bg-white/10 text-white hover:bg-white/20 uppercase tracking-bugatti-mono font-mono rounded-full",
        ghost: "hover:bg-white/10 text-white uppercase tracking-bugatti-mono font-mono",
        link: "text-accent underline-offset-4 hover:underline font-body",
      },
      size: {
        default: "h-11 px-8 py-2",
        sm: "h-9 rounded-full px-4",
        lg: "h-14 rounded-full px-12 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
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