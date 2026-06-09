"use client"

import Link from "next/link"
import { useState } from "react"
import { FileBadge, Upload, Layers, ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button, Input, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { useCertificateIssuance } from "@/hooks/use-certificates"
import { useWallet } from "@/hooks/use-wallet"
import { StatusPill } from "@/components/shared/status-pill"
import { toast } from "sonner"

export default function IssuerDashboardPage() {
  const { wallet, connect } = useWallet()
  const { issue, issuing } = useCertificateIssuance()
  const [studentId, setStudentId] = useState("")
  const [courseId, setCourseId] = useState("")
  const [docHash, setDocHash] = useState("")

  const handleIssue = async () => {
    if (!wallet.isConnected) {
      await connect()
      return
    }
    try {
      const graduationDate = Math.floor(Date.now() / 1000)
      await issue(
        studentId,
        courseId,
        graduationDate,
        docHash || `doc-${Date.now()}`
      )
      toast.success("Credential issued on-chain")
      setStudentId("")
      setCourseId("")
      setDocHash("")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Issuance failed")
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Issuer workspace"
        title="Issue credentials"
        description="Mint tamper-proof credentials for learners. Single issuance, batch workflows, and document anchoring."
        actions={
          wallet.isConnected ? (
            <StatusPill variant="brand">Wallet connected</StatusPill>
          ) : (
            <Button onClick={connect}>Connect wallet</Button>
          )
        }
      />

      <Tabs defaultValue="single" className="space-y-6">
        <TabsList>
          <TabsTrigger value="single" className="gap-2">
            <FileBadge className="h-4 w-4" /> Single
          </TabsTrigger>
          <TabsTrigger value="batch" className="gap-2">
            <Layers className="h-4 w-4" /> Batch
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" /> Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <div className="surface max-w-2xl space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Student ID</label>
                <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="STU-2026-001" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Course ID</label>
                <Input value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="CS-401" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Document hash</label>
              <Input value={docHash} onChange={(e) => setDocHash(e.target.value)} placeholder="Optional integrity hash" />
            </div>
            <Button onClick={handleIssue} disabled={issuing || !studentId || !courseId}>
              {issuing ? "Issuing…" : "Issue credential"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="batch">
          <div className="surface p-6">
            <p className="text-sm text-muted-foreground">
              Batch issuance supports up to 500 credentials per transaction with gas-optimized registry writes.
            </p>
            <Button className="mt-4" variant="outline" asChild>
              <Link href="/issue">
                Open advanced batch tools <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="upload">
          <div className="surface border-dashed p-8 text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Document-backed issuance</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect to the API backend for PDF uploads, QR generation, and off-chain metadata storage.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
