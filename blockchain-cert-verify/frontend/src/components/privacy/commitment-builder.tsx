"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from "@/components/ui"
import { Lock, Key, Copy, CheckCheck } from "lucide-react"
import { generateSalt } from "@/lib/utils"
import { motion } from "framer-motion"

export function CommitmentBuilder() {
  const [data, setData] = useState("")
  const [salt, setSalt] = useState(generateSalt())
  const [commitment, setCommitment] = useState("")
  const [copied, setCopied] = useState(false)

  const computeCommitment = () => {
    if (!data) return
    const encoder = new TextEncoder()
    const dataHash = Array.from(
      new Uint8Array(
        encoder.encode(JSON.stringify({ data }))
      )
    ).map(b => b.toString(16).padStart(2, "0")).join("")

    setCommitment(`0x${dataHash.slice(0, 64).padEnd(64, "0")}`)
  }

  const refreshSalt = () => {
    setSalt(generateSalt())
    setCommitment("")
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          Salted Commitment Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Certificate Data (JSON)</p>
          <textarea
            className="w-full h-24 rounded-lg border border-input bg-background p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder='{"name": "Alice", "degree": "BSc"}'
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">Salt</p>
            <Input value={salt} readOnly />
          </div>
          <Button variant="outline" size="icon" onClick={refreshSalt}>
            <Key className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={computeCommitment} disabled={!data} className="w-full">
          Generate Commitment
        </Button>

        {commitment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p className="text-sm text-muted-foreground">Computed Commitment</p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted font-mono text-xs break-all">
              <span className="flex-1">{commitment}</span>
              <button onClick={() => copyToClipboard(commitment)} className="p-1 hover:text-primary">
                {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
