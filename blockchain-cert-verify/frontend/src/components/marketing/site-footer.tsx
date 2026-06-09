import Link from "next/link"
import { SITE_CONFIG } from "@/lib/constants"

const links = [
  { href: "/verify", label: "Verify credentials" },
  { href: "/dashboard", label: "Platform" },
  { href: "/#security", label: "Security" },
  { href: SITE_CONFIG.links.github, label: "GitHub", external: true },
]

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient text-xs font-bold text-white">
                CV
              </div>
              <span className="font-semibold">{SITE_CONFIG.name}</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              The trusted credential infrastructure for universities, governments, and enterprises.
              Issue once. Verify anywhere. Forever auditable.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {links.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
                  {link.label}
                </Link>
              )
            )}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.</p>
          <p>SOC 2 ready · GDPR aligned · WCAG AA in progress</p>
        </div>
      </div>
    </footer>
  )
}
