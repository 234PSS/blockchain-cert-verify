import { cn } from "@/lib/utils"

const variants = {
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20",
  danger: "bg-red-500/10 text-red-700 dark:text-red-400 ring-red-500/20",
  neutral: "bg-muted text-muted-foreground ring-border",
  brand: "bg-brand/10 text-brand ring-brand/20",
} as const

export function StatusPill({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode
  variant?: keyof typeof variants
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
