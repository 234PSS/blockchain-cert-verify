import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  loading,
  className,
}: {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  trend?: { value: string; positive?: boolean }
  loading?: boolean
  className?: string
}) {
  return (
    <div className={cn("surface p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          )}
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
          {trend ? (
            <p
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              )}
            >
              {trend.value}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function MetricGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>
  )
}
