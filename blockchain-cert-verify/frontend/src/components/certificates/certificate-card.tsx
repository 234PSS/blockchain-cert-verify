"use client"

import { Card, CardContent, Badge } from "@/components/ui"
import { Certificate } from "@/types"
import { shortenAddress, formatTimestamp } from "@/lib/utils"
import { Award, Clock, Hash, User, Ban, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CertificateCardProps {
  certificate: Certificate
  onClick?: () => void
  className?: string
}

export function CertificateCard({ certificate, onClick, className }: CertificateCardProps) {
  return (
    <Card
      className={cn("cursor-pointer hover:shadow-md transition-all", className)}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <Badge variant={certificate.revoked ? "destructive" : "success"}>
            {certificate.revoked ? "Revoked" : "Active"}
          </Badge>
        </div>

        <h3 className="font-semibold text-lg mb-1">
          {certificate.studentName || "Certificate"}
        </h3>
        {certificate.courseName && (
          <p className="text-sm text-muted-foreground mb-3">{certificate.courseName}</p>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Hash className="h-3 w-3 shrink-0" />
            <span className="font-mono truncate">{shortenAddress(certificate.certificateId, 8)}</span>
          </div>
          {certificate.issuer && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span className="font-mono truncate">{shortenAddress(certificate.issuer)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{formatTimestamp(certificate.issuedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
