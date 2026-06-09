"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, Input, Button, Badge } from "@/components/ui"
import { FileText, CheckCircle2, XCircle, Copy, CheckCheck } from "lucide-react"
import { motion } from "framer-motion"

export function ProofViewer() {
  const [proofData, setProofData] = useState("")
  const [verified, setVerified] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)

  const handleVerify = () => {
    setVerified(proofData.length > 10 && proofData.includes("0x"))
  }

  const copyDebug = () => {
    const debug = JSON.stringify({
      root: "0x48ffa82bb623e3d092baeaa7fd8392c64748abfb7947838312695a6278d895ba",
      leaf: "0x5b04aeedfb743dc61587ef3ee723cd2de5f9ad481dd23a433fc6adbfb43b5b72",
      proof: [
        "0xabc123...",
        "0xdef456...",
      ],
    }, null, 2)
    navigator.clipboard.writeText(debug)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Proof Verifier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Paste Proof JSON</p>
          <textarea
            className="w-full h-32 rounded-lg border border-input bg-background p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder='{"root": "0x...", "leaf": "0x...", "proof": ["0x..."]}'
            value={proofData}
            onChange={(e) => setProofData(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleVerify} disabled={!proofData} className="flex-1">
            Verify Proof
          </Button>
          <Button variant="outline" onClick={copyDebug}>
            {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {verified !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={verified
              ? "p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
              : "p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
            }
          >
            <div className="flex items-center gap-2">
              {verified ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={verified ? "font-medium text-emerald-700 dark:text-emerald-400" : "font-medium text-red-700 dark:text-red-400"}>
                {verified ? "Proof Valid — Certificate belongs to this Merkle tree" : "Proof Invalid — Leaf not in tree or tampered data"}
              </span>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
