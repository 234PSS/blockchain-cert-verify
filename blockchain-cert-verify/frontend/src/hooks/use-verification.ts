"use client"

import { useState, useCallback } from "react"
import { verifyCertificateOnChain } from "@/lib/contract"
import type { VerificationResult } from "@/types"

export function useVerification() {
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verify = useCallback(async (certificateId: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await verifyCertificateOnChain(certificateId)
      setResult(data)
    } catch (err: any) {
      setError(err.message || "Verification failed")
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, loading, error, verify, reset }
}
