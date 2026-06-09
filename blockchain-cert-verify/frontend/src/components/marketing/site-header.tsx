"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { MARKETING_NAV } from "@/lib/navigation"
import { SITE_CONFIG } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b bg-background/75 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-sm font-bold text-white">
            CV
          </div>
          <span className="text-lg font-semibold tracking-tight">{SITE_CONFIG.name}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Marketing">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Get started</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className={cn("border-t md:hidden", open ? "block" : "hidden")}>
        <nav className="container flex flex-col gap-1 py-3" aria-label="Mobile marketing">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Button className="mt-2" asChild>
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              Get started
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
