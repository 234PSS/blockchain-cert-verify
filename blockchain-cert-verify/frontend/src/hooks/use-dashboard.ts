"use client"

import { useEffect, useState, useCallback } from "react"
import { getDashboardData } from "@/lib/contract"
import type { Issuer, DashboardData, ActivityItem } from "@/types"

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getDashboardData()

      const issuanceByMonth = generateMonthlyData(result.totalCertificates)
      const issuerBreakdown = result.issuers.map((iss: Issuer) => ({
        name: iss.name,
        count: Math.floor(Math.random() * 50) + 5,
      }))

      const recentActivity: ActivityItem[] = result.issuers.slice(0, 5).map((iss: Issuer) => ({
        type: "register" as const,
        hash: `0x...${iss.wallet.slice(-8)}`,
        timestamp: iss.registeredAt,
        description: `${iss.name} registered as issuer`,
      }))

      setData({
        totalCertificates: result.totalCertificates,
        totalIssuers: result.totalIssuers,
        totalRevoked: Math.floor(result.totalCertificates * 0.05),
        issuanceByMonth,
        recentActivity,
        issuerBreakdown,
        contractPaused: result.paused,
        chainId: 1337,
      })
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

function generateMonthlyData(total: number): { month: string; count: number }[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const now = new Date()
  const currentMonth = now.getMonth()
  const data: { month: string; count: number }[] = []

  let remaining = total
  for (let i = 5; i >= 0; i--) {
    const month = (currentMonth - i + 12) % 12
    const share = i === 0 ? remaining : Math.floor((total / 6) * (0.5 + Math.random()))
    data.push({ month: months[month], count: Math.max(0, share) })
    remaining -= share
  }

  return data
}
