"use client"

import { useEffect, useState } from "react"
import { Building2, Globe, Plus } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui"
import { StatusPill } from "@/components/shared/status-pill"
import { EmptyState } from "@/components/shared/empty-state"
import { DashboardSkeleton } from "@/components/shared/loading-grid"
import { getDashboardData } from "@/lib/contract"
import type { Issuer } from "@/types"
import { shortenAddress } from "@/lib/utils"

export default function OrganizationsPage() {
  const [issuers, setIssuers] = useState<Issuer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardData()
      .then((d) => setIssuers(d.issuers))
      .catch(() => setIssuers([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Organizations"
        title="Institution & issuer management"
        description="Register universities, certification bodies, and enterprise issuers with isolated Merkle roots and access policies."
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add organization
          </Button>
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : issuers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations registered"
          description="Connect your admin wallet and register the first issuing institution on-chain."
          action={<Button>Register issuer</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {issuers.map((issuer) => (
            <div key={issuer.wallet} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Building2 className="h-5 w-5 text-brand" />
                </div>
                <StatusPill variant={issuer.active ? "success" : "warning"}>
                  {issuer.active ? "Active" : "Inactive"}
                </StatusPill>
              </div>
              <h3 className="mt-4 font-semibold tracking-tight">{issuer.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                {issuer.domain}
              </p>
              <p className="mt-3 font-mono text-xs text-muted-foreground">{shortenAddress(issuer.wallet)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
