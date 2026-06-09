"use client"

import { useTheme } from "next-themes"
import { Bell, KeyRound, Palette, Shield, Wallet } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button, Input } from "@/components/ui"
import { StatusPill } from "@/components/shared/status-pill"
import { useWallet } from "@/hooks/use-wallet"
import { CHAIN_ID, RPC_URL } from "@/lib/constants"

const sections = [
  { icon: Wallet, title: "Wallet & chain", description: "Connected account and network configuration." },
  { icon: Shield, title: "Security", description: "Session controls, API keys, and audit preferences." },
  { icon: Bell, title: "Notifications", description: "Issuance alerts, revocation notices, and verification digests." },
  { icon: KeyRound, title: "API access", description: "Programmatic issuance and verification credentials." },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { wallet, connect } = useWallet()

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Platform preferences"
        description="Personalize appearance, manage connectivity, and configure enterprise controls."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-6">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-brand" />
            <h3 className="font-semibold">Appearance</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Switch between light and dark modes.</p>
          <div className="mt-4 flex gap-2">
            {(["light", "dark", "system"] as const).map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={theme === mode ? "default" : "outline"}
                onClick={() => setTheme(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="surface p-6">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-brand" />
            <h3 className="font-semibold">Wallet connection</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Chain {CHAIN_ID} · RPC {RPC_URL.replace("http://", "")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {wallet.isConnected ? (
              <StatusPill variant="success">{wallet.address}</StatusPill>
            ) : (
              <Button size="sm" onClick={connect}>Connect wallet</Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sections.slice(1).map((section) => {
          const Icon = section.icon
          return (
            <div key={section.title} className="surface flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          )
        })}
      </div>

      <div className="surface p-6">
        <h3 className="font-semibold">Organization profile</h3>
        <p className="mt-1 text-sm text-muted-foreground">Displayed on verification receipts and public portals.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input placeholder="Institution legal name" aria-label="Institution name" />
          <Input placeholder="support@university.edu" aria-label="Support email" />
        </div>
        <Button className="mt-4">Save changes</Button>
      </div>
    </div>
  )
}
