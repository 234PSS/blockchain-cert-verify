"use client"

import { RefreshCw } from "lucide-react"
import { Award, Users, Ban, Activity } from "lucide-react"
import { Button } from "@/components/ui"
import { PageHeader } from "@/components/shared/page-header"
import { MetricCard, MetricGrid } from "@/components/shared/metric-card"
import { DashboardSkeleton } from "@/components/shared/loading-grid"
import { StatusPill } from "@/components/shared/status-pill"
import { CertificateChart, RecentActivity, IssuerBreakdown } from "@/components/dashboard"
import { useDashboard } from "@/hooks/use-dashboard"

export default function UniversityDashboardPage() {
  const { data, loading, error, refetch } = useDashboard()

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="University overview" description="Real-time credential ecosystem metrics." />
        <div className="surface p-8 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={refetch}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="University dashboard"
        title="Credential operations overview"
        description="Monitor issuance volume, issuer health, and registry status across your institution."
        actions={
          <>
            <StatusPill variant={data.contractPaused ? "warning" : "success"}>
              {data.contractPaused ? "Registry paused" : "All systems operational"}
            </StatusPill>
            <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </>
        }
      />

      <MetricGrid>
        <MetricCard label="Total credentials" value={data.totalCertificates} icon={Award} trend={{ value: "+12% vs last month", positive: true }} />
        <MetricCard label="Active issuers" value={data.totalIssuers} icon={Users} />
        <MetricCard label="Revoked" value={data.totalRevoked} icon={Ban} />
        <MetricCard
          label="Registry status"
          value={data.contractPaused ? "Paused" : "Active"}
          icon={Activity}
          hint={data.contractPaused ? "Admin intervention required" : "Issuance and verification enabled"}
        />
      </MetricGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CertificateChart data={data.issuanceByMonth} type="area" />
        </div>
        <IssuerBreakdown data={data.issuerBreakdown} />
      </div>

      <RecentActivity activities={data.recentActivity} />
    </div>
  )
}
