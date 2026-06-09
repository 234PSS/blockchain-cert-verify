"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { ActivityItem } from "@/types"
import { ScrollText, RotateCcw, TreePine, Ban, UserPlus } from "lucide-react"
import { formatTimestamp } from "@/lib/utils"
import { cn } from "@/lib/utils"

const activityIcons = {
  issue: ScrollText,
  revoke: Ban,
  merkle: TreePine,
  pause: RotateCcw,
  register: UserPlus,
} as const

const activityColors = {
  issue: "text-blue-500 bg-blue-50 dark:bg-blue-950/50",
  revoke: "text-red-500 bg-red-50 dark:bg-red-950/50",
  merkle: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50",
  pause: "text-amber-500 bg-amber-50 dark:bg-amber-950/50",
  register: "text-purple-500 bg-purple-50 dark:bg-purple-950/50",
} as const

interface RecentActivityProps {
  activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((item, i) => {
            const Icon = activityIcons[item.type] || ScrollText
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className={cn("p-2 rounded-lg shrink-0", activityColors[item.type])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(item.timestamp)}
                    </span>
                    {item.hash && (
                      <span className="text-xs font-mono text-muted-foreground truncate">
                        {item.hash}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
