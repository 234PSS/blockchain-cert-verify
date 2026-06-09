import { Shield } from "lucide-react"
import { SITE_CONFIG } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>&copy; {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.</span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href={SITE_CONFIG.links.github} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
            GitHub
          </a>
          <span>Built on Ethereum</span>
        </div>
      </div>
    </footer>
  )
}
