"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { VerifyPortal } from "@/components/verification/verify-portal"
import { useVerification } from "@/hooks/use-verification"

export default function CertificateVerifyPage() {
  const params = useParams()
  const certificateId = decodeURIComponent(params.certificateId as string)
  const { verify } = useVerification()

  useEffect(() => {
    if (certificateId) verify(certificateId)
  }, [certificateId, verify])

  return <VerifyPortal initialId={certificateId} />
}
