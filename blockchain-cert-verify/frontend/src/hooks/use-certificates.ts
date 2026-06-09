"use client"

import { useState, useCallback } from "react"
import { issueCertificate, issueCertificatesBatch } from "@/lib/contract"
import { parseBlockchainError } from "@/lib/utils"

export function useCertificateIssuance() {
  const [issuing, setIssuing] = useState(false)
  const [result, setResult] = useState<{ certificateId: string; txHash: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const issue = useCallback(async (
    studentId: string,
    courseId: string,
    graduationDate: number,
    certificateHash: string
  ) => {
    setIssuing(true)
    setError(null)
    setResult(null)
    try {
      const data = await issueCertificate(studentId, courseId, graduationDate, certificateHash)
      setResult(data)
      return data
    } catch (err: unknown) {
      const msg = parseBlockchainError(err)
      setError(msg)
      throw err
    } finally {
      setIssuing(false)
    }
  }, [])

  const issueBatch = useCallback(async (
    items: { studentId: string; courseId: string; graduationDate: number; certificateHash: string }[]
  ) => {
    setIssuing(true)
    setError(null)
    try {
      const data = await issueCertificatesBatch(items)
      return data
    } catch (err: unknown) {
      const msg = parseBlockchainError(err)
      setError(msg)
      throw err
    } finally {
      setIssuing(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { issuing, result, error, issue, issueBatch, reset }
}
