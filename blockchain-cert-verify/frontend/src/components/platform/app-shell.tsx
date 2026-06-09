"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X, Command } from "lucide-react"
import { PLATFORM_NAV, SECONDARY_PLATFORM_NAV } from "@/lib/navigation"
import { SITE_CONFIG } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { useWallet } from "@/hooks/use-wallet"

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={onNavigate}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient text-xs font-bold text-white">
            CV
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">{SITE_CONFIG.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">Credential platform</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-4 p-3" aria-label="Platform">
        <div className="space-y-1">
        {PLATFORM_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/80 hover:bg-muted/80"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-brand" : "text-muted-foreground")} />
              <span className="truncate font-medium">{item.label}</span>
            </Link>
          )
        })}
        </div>
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Advanced</p>
          {SECONDARY_PLATFORM_NAV.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-accent text-accent-foreground" : "text-foreground/80 hover:bg-muted/80"
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t p-3">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium">Need help?</p>
          <p className="mt-1 text-xs text-muted-foreground">Documentation and onboarding for your institution.</p>
          <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
            <Link href="/#product">View guides</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { wallet, connecting, connect } = useWallet()

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[16.5rem] border-r bg-muted/30 lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[16.5rem] border-r bg-background shadow-xl">
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[16.5rem]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground md:flex">
            <Command className="h-3.5 w-3.5" />
            <span>Search credentials, orgs, or settings</span>
            <kbd className="ml-6 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={connect} disabled={connecting}>
              {wallet.isConnected
                ? `${wallet.address?.slice(0, 6)}…${wallet.address?.slice(-4)}`
                : connecting
                  ? "Connecting…"
                  : "Connect wallet"}
            </Button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
