"use client"

import { useState } from "react"
import { ShieldCheck, Search } from "lucide-react"
import { VerificationForm } from "@/components/verification/verification-form"
import { useVerification } from "@/hooks/use-verification"
import { PageHeader } from "@/components/shared/page-header"

export function VerifyPortal({
  initialId = "",
  showHeader = true,
}: {
  initialId?: string
  showHeader?: boolean
}) {
  const [certificateId, setCertificateId] = useState(initialId)
  const { result, loading, error, verify } = useVerification()

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {showHeader ? (
        <PageHeader
          eyebrow="Verification"
          title="Credential verification portal"
          description="Confirm authenticity, issuer identity, and revocation status in seconds."
        />
      ) : (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <ShieldCheck className="h-6 w-6 text-brand" />
          </div>
          <h1 className="font-display text-3xl tracking-tight">Verification portal</h1>
          <p className="mt-2 text-muted-foreground">No account required.</p>
        </div>
      )}

      <VerificationForm
        certificateId={certificateId}
        onCertificateIdChange={setCertificateId}
        onVerify={() => certificateId && verify(certificateId)}
        loading={loading}
        result={result}
        error={error}
      />

      <div className="surface bg-muted/30 p-5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Search className="h-4 w-4" />
          What gets verified
        </div>
        <p className="mt-2">
          Registry records are checked for valid issuance, issuer wallet, integrity hash, and revocation state.
        </p>
      </div>
    </div>
  )
}
