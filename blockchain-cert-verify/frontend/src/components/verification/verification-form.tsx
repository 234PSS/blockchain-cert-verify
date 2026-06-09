"use client"

import { Card, CardContent, CardHeader, CardTitle, Input, Button, Badge, Separator } from "@/components/ui"
import { Search, CheckCircle2, XCircle, Award, ExternalLink } from "lucide-react"
import { VerificationResult } from "@/types"
import { shortenAddress, formatTimestamp } from "@/lib/utils"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface VerificationFormProps {
  certificateId: string
  onCertificateIdChange: (value: string) => void
  onVerify: () => void
  loading: boolean
  result: VerificationResult | null
  error: string | null
}

export function VerificationForm({
  certificateId,
  onCertificateIdChange,
  onVerify,
  loading,
  result,
  error,
}: VerificationFormProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Verify Certificate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter certificate ID (0x...)"
                value={certificateId}
                onChange={(e) => onCertificateIdChange(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Button onClick={onVerify} disabled={loading || !certificateId}>
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
            >
              <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Verification Failed</p>
                <p className="text-sm mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <VerificationResultCard result={result} />
        </motion.div>
      )}
    </div>
  )
}

function VerificationResultCard({ result }: { result: VerificationResult }) {
  const isValid = result.valid && !result.revoked

  return (
    <Card className={cn(
      "overflow-hidden",
      isValid ? "border-emerald-200 dark:border-emerald-800" : "border-red-200 dark:border-red-800"
    )}>
      <div className={cn(
        "p-6 text-center",
        isValid ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-red-50 dark:bg-red-950/30"
      )}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          {isValid ? (
            <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500" />
          ) : (
            <XCircle className="h-16 w-16 mx-auto text-red-500" />
          )}
        </motion.div>
        <h2 className={cn(
          "text-2xl font-bold mt-3",
          isValid ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
        )}>
          {isValid ? "Certificate is Valid" : result.revoked ? "Certificate Revoked" : "Certificate Not Found"}
        </h2>
      </div>

      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Issuer</p>
            <p className="font-mono text-sm mt-1">{shortenAddress(result.issuer)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Issued</p>
            <p className="text-sm mt-1">{formatTimestamp(result.issuedAt)}</p>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Certificate Hash</p>
          <p className="font-mono text-sm mt-1 break-all">{result.certificateHash}</p>
        </div>

        {result.merkleValid !== undefined && (
          <div className="flex items-center gap-2">
            <Badge variant={result.merkleValid ? "success" : "destructive"}>
              Merkle Proof: {result.merkleValid ? "Valid" : "Invalid"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
