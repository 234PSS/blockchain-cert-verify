"use client"

import Link from "next/link"
import { Shield, Menu, X } from "lucide-react"
import { Button } from "@/components/ui"
import { SITE_CONFIG } from "@/lib/constants"
import { useWallet } from "@/hooks/use-wallet"
import { shortenAddress } from "@/lib/utils"
import { useState } from "react"

export function Header() {
  const { wallet, connecting, connect } = useWallet()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="gradient-primary p-2 rounded-lg shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">{SITE_CONFIG.name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/issue" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Issue
          </Link>
          <Link href="/verify" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Verify
          </Link>
          <Link href="/privacy" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Privacy
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {wallet.isConnected ? (
            <Button variant="outline" size="sm" className="gap-2 font-mono text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {shortenAddress(wallet.address!)}
            </Button>
          ) : (
            <Button onClick={connect} disabled={connecting} size="sm">
              {connecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-background p-4 animate-fade-in">
          <nav className="flex flex-col gap-3">
            <Link href="/dashboard" className="text-sm font-medium p-2 rounded-lg hover:bg-accent" onClick={() => setMobileOpen(false)}>
              Dashboard
            </Link>
            <Link href="/issue" className="text-sm font-medium p-2 rounded-lg hover:bg-accent" onClick={() => setMobileOpen(false)}>
              Issue Certificate
            </Link>
            <Link href="/verify" className="text-sm font-medium p-2 rounded-lg hover:bg-accent" onClick={() => setMobileOpen(false)}>
              Verify
            </Link>
            <Link href="/privacy" className="text-sm font-medium p-2 rounded-lg hover:bg-accent" onClick={() => setMobileOpen(false)}>
              Privacy Tools
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
