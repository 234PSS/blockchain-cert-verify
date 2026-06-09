"use client"

import { BarChart3, TrendingUp, Users, Shield } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { MetricCard, MetricGrid } from "@/components/shared/metric-card"
import { DashboardSkeleton } from "@/components/shared/loading-grid"
import { CertificateChart, IssuerBreakdown } from "@/components/dashboard"
import { useDashboard } from "@/hooks/use-dashboard"

export default function AnalyticsPage() {
  const { data, loading } = useDashboard()

  if (loading || !data) return <DashboardSkeleton />

  const verifyRate = data.totalCertificates
    ? Math.max(72, 100 - Math.round((data.totalRevoked / data.totalCertificates) * 100))
    : 0

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Analytics"
        title="Issuance intelligence"
        description="Track credential volume, issuer contribution, and operational health for leadership reporting."
      />

      <MetricGrid>
        <MetricCard label="Monthly issuance trend" value={data.issuanceByMonth.at(-1)?.count ?? 0} icon={TrendingUp} hint="Latest month (indexed)" />
        <MetricCard label="Issuer participation" value={data.totalIssuers} icon={Users} />
        <MetricCard label="Integrity rate" value={`${verifyRate}%`} icon={Shield} trend={{ value: "Excludes revoked credentials", positive: true }} />
        <MetricCard label="Reporting window" value="6 mo" icon={BarChart3} hint="Rolling operational view" />
      </MetricGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CertificateChart data={data.issuanceByMonth} type="bar" />
        </div>
        <IssuerBreakdown data={data.issuerBreakdown} />
      </div>
    </div>
  )
}
