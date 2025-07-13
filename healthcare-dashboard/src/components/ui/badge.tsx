import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200 shadow-sm hover:scale-105 hover:shadow-md overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-br from-teal-900/30 to-cyan-900/30 text-teal-300 border-teal-400/40 hover:bg-gradient-to-br hover:from-teal-800/40 hover:to-cyan-800/40",
        gold:
          "border-gold-400/40 bg-gold-900/30 text-gold-300 hover:bg-gold-800/40",
        amber:
          "border-amber-400/40 bg-amber-900/30 text-amber-300 hover:bg-amber-800/40",
        rose:
          "border-rose-400/40 bg-rose-900/30 text-rose-300 hover:bg-rose-800/40",
        teal:
          "border-teal-400/40 bg-teal-900/30 text-teal-300 hover:bg-teal-800/40",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
