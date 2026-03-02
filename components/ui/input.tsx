import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    data-slot="input"
    className={cn(
      "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-secondary border-input h-10 w-full min-w-0 rounded-xl border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/25",
      "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
      className
    )}
    {...props}
  />
))

Input.displayName = "Input"

export { Input }
