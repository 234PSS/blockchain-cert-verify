"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, Input, Button, Badge } from "@/components/ui"
import { Eye, EyeOff, ShieldCheck, Copy } from "lucide-react"
import { motion } from "framer-motion"

type FieldEntry = { key: string; value: string; reveal: boolean }

export function SelectiveDisclosureTool() {
  const [fields, setFields] = useState<FieldEntry[]>([
    { key: "name", value: "Alice Johnson", reveal: true },
    { key: "degree", value: "Bachelor of Science", reveal: true },
    { key: "gpa", value: "3.8", reveal: false },
    { key: "studentId", value: "STU-2024-001", reveal: false },
    { key: "gradYear", value: "2026", reveal: true },
  ])

  const [root, setRoot] = useState("")

  const toggleReveal = (index: number) => {
    const updated = fields.map((f, i) =>
      i === index ? { ...f, reveal: !f.reveal } : f
    )
    setFields(updated)
  }

  const computeProof = () => {
    const sorted = [...fields].sort((a, b) => a.key.localeCompare(b.key))
    const concatenated = sorted.map(f => `${f.key}:${f.value}`).join("||")
    const encoder = new TextEncoder()
    const hash = Array.from(new Uint8Array(encoder.encode(concatenated)))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
    setRoot(`0x${hash.slice(0, 64).padEnd(64, "0")}`)
  }

  const revealedFields = fields.filter(f => f.reveal)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Selective Disclosure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose which fields to reveal. Hidden fields remain private.
        </p>

        <div className="space-y-2">
          {fields.map((field, i) => (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{field.key}</p>
                <p className="text-xs text-muted-foreground truncate">{field.value}</p>
              </div>
              <Badge variant={field.reveal ? "success" : "secondary"}>
                {field.reveal ? "Revealed" : "Hidden"}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleReveal(i)}
              >
                {field.reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </motion.div>
          ))}
        </div>

        <Button onClick={computeProof} className="w-full">
          Generate Disclosure Proof
        </Button>

        {root && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Proof Generated
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Root Hash</p>
                <p className="font-mono text-xs break-all bg-background p-2 rounded-md">{root}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Revealing {revealedFields.length} of {fields.length} fields
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {fields.map(f => (
                    <Badge key={f.key} variant={f.reveal ? "success" : "secondary"} className="text-[10px]">
                      {f.key}: {f.reveal ? "✓" : "🔒"}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
