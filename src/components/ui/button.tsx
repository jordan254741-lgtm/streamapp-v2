/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.1)]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.2)]",
        outline:
          "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20",
        secondary:
          "bg-white/10 text-white hover:bg-white/15",
        ghost:
          "text-white hover:bg-white/10",
        link:
          "text-white underline-offset-4 hover:underline",
        glow:
          "bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
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
