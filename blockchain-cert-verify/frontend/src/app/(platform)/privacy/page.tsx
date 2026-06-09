"use client"

import { PageHeader } from "@/components/shared/page-header"
import { CommitmentBuilder, SelectiveDisclosureTool, ProofViewer } from "@/components/privacy"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"

export default function PrivacyToolsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Privacy"
        title="Selective disclosure tools"
        description="Generate commitments, build disclosure proofs, and validate privacy-preserving verification payloads."
      />
      <Tabs defaultValue="commitment" className="space-y-6">
        <TabsList>
          <TabsTrigger value="commitment">Commitments</TabsTrigger>
          <TabsTrigger value="disclosure">Selective disclosure</TabsTrigger>
          <TabsTrigger value="proof">Proof viewer</TabsTrigger>
        </TabsList>
        <TabsContent value="commitment"><CommitmentBuilder /></TabsContent>
        <TabsContent value="disclosure"><SelectiveDisclosureTool /></TabsContent>
        <TabsContent value="proof"><ProofViewer /></TabsContent>
      </Tabs>
    </div>
  )
}
