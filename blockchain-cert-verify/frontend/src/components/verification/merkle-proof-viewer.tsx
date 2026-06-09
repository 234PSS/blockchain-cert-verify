"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui"
import { TreePine, Link as LinkIcon } from "lucide-react"
import type { MerkleProof } from "@/types"
import { shortenAddress } from "@/lib/utils"

interface MerkleProofViewerProps {
  proof: MerkleProof
}

export function MerkleProofViewer({ proof }: MerkleProofViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TreePine className="h-5 w-5 text-primary" />
          Merkle Proof
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Root</p>
            <p className="font-mono text-xs break-all bg-muted p-2 rounded-md">
              {shortenAddress(proof.root, 16)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Leaf</p>
            <p className="font-mono text-xs break-all bg-muted p-2 rounded-md">
              {shortenAddress(proof.leaf, 16)}
            </p>
          </div>
        </div>

        {proof.salt && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Salt</p>
            <p className="font-mono text-xs break-all bg-muted p-2 rounded-md">{shortenAddress(proof.salt, 16)}</p>
          </div>
        )}

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Proof Siblings ({proof.proof.length})
          </p>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {proof.proof.map((sibling, i) => (
              <div key={i} className="flex items-center gap-2 font-mono text-xs bg-muted/50 p-2 rounded-md">
                <LinkIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground shrink-0">[{i}]:</span>
                <span className="break-all">{shortenAddress(sibling, 12)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
