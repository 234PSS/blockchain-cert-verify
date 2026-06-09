"use client"

import { useEffect, useState } from "react"
import { Search, FileText } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Input, Button } from "@/components/ui"
import { StatusPill } from "@/components/shared/status-pill"
import { EmptyState } from "@/components/shared/empty-state"
import { DashboardSkeleton } from "@/components/shared/loading-grid"
import { getDashboardData, verifyCertificateOnChain } from "@/lib/contract"
import { shortenAddress, formatTimestamp } from "@/lib/utils"
import type { VerificationResult } from "@/types"

type ExplorerRow = VerificationResult & { certificateId: string }

export default function CertificateExplorerPage() {
  const [query, setQuery] = useState("")
  const [rows, setRows] = useState<ExplorerRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await getDashboardData()
        const sample = await Promise.all(
          data.certificateIds.slice(0, 8).map(async (id) => {
            const result = await verifyCertificateOnChain(id)
            return { certificateId: id, ...result }
          })
        )
        if (!cancelled) setRows(sample)
      } catch {
        if (!cancelled) setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = rows.filter((r) =>
    !query || r.certificateId.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Certificate explorer"
        title="Search the credential registry"
        description="Browse recently indexed on-chain credentials with issuer, status, and integrity details."
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Filter by certificate ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11"
        />
        <Button variant="outline" className="h-11" onClick={() => setQuery("")}>
          Clear
        </Button>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No credentials found"
          description="Issue credentials from the issuer workspace or adjust your search filter."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Certificate ID</th>
                  <th className="px-4 py-3 font-medium">Issuer</th>
                  <th className="px-4 py-3 font-medium">Issued</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.certificateId} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">{shortenAddress(row.certificateId, 8)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{shortenAddress(row.issuer)}</td>
                    <td className="px-4 py-3">{formatTimestamp(row.issuedAt)}</td>
                    <td className="px-4 py-3">
                      {!row.valid ? (
                        <StatusPill variant="neutral">Not found</StatusPill>
                      ) : row.revoked ? (
                        <StatusPill variant="danger">Revoked</StatusPill>
                      ) : (
                        <StatusPill variant="success">Valid</StatusPill>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
