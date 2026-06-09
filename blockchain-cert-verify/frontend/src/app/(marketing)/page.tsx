"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Shield, Building2, Globe2, Lock } from "lucide-react"
import { Button, Input } from "@/components/ui"
import { PRODUCT_HIGHLIGHTS } from "@/lib/navigation"
import { fadeUp, fadeUpItem, staggerContainer } from "@/lib/motion"
import { useState } from "react"
import { useRouter } from "next/navigation"

const logos = ["Ministry of Education", "State University", "TechCert Authority", "Global HR Alliance"]
const metrics = [
  { value: "99.99%", label: "Verification uptime" },
  { value: "<2s", label: "Median verify time" },
  { value: "500+", label: "Batch issuance limit" },
  { value: "SOC 2", label: "Security posture" },
]

export default function LandingPage() {
  const [certId, setCertId] = useState("")
  const router = useRouter()

  return (
    <div className="overflow-hidden">
      <section className="relative border-b">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--accent))_0%,transparent_50%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
        <div className="container relative py-16 sm:py-24 lg:py-28">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mx-auto max-w-3xl text-center"
          >
            <motion.p variants={fadeUpItem} className="text-sm font-medium text-brand">
              Credential infrastructure for institutions
            </motion.p>
            <motion.h1
              variants={fadeUpItem}
              className="mt-4 font-display text-4xl font-normal tracking-tight text-balance sm:text-6xl lg:text-7xl"
            >
              Digital credentials people{" "}
              <span className="text-brand-gradient">actually trust</span>
            </motion.h1>
            <motion.p variants={fadeUpItem} className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Issue, verify, and govern academic and professional credentials with enterprise controls,
              privacy-preserving proofs, and an experience your stakeholders expect.
            </motion.p>
            <motion.div variants={fadeUpItem} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Start issuing <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/verify">Verify a credential</Link>
              </Button>
            </motion.div>
            <motion.form
              variants={fadeUpItem}
              className="mx-auto mt-10 flex max-w-xl flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault()
                if (certId.trim()) router.push(`/verify/${encodeURIComponent(certId.trim())}`)
              }}
            >
              <Input
                placeholder="Paste certificate ID to verify instantly"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                aria-label="Certificate ID"
                className="h-11"
              />
              <Button type="submit" className="h-11 shrink-0">
                Verify now
              </Button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      <section className="border-b bg-muted/30 py-8">
        <div className="container">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Trusted by forward-thinking institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-muted-foreground">
            {logos.map((name) => (
              <span key={name} className="font-medium">{name}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="container py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Built for institutional scale</h2>
          <p className="mt-3 text-muted-foreground">
            Not another wallet-first dApp. A credential platform designed around compliance, clarity, and conversion.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PRODUCT_HIGHLIGHTS.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="surface p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section id="security" className="border-y bg-muted/20 py-20">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-brand">Security & compliance</p>
            <h2 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
              Cryptographic assurance without the crypto UX
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                "Upgradeable smart contracts with role-based access and emergency pause",
                "Hash-only on-chain storage — learner PII stays off-chain",
                "Merkle proofs and selective disclosure for privacy-preserving verification",
                "Full audit trail for issuance, revocation, and verification events",
              ].map((line) => (
                <li key={line} className="flex gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {metrics.map((m) => (
              <div key={m.label} className="surface p-5">
                <p className="text-2xl font-semibold tracking-tight">{m.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="container py-20 sm:py-24">
        <div className="surface mx-auto max-w-3xl bg-muted/30 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Building2 className="h-6 w-6 text-brand" />
          </div>
          <h2 className="mt-6 font-display text-3xl tracking-tight">Enterprise deployments</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            White-label portals, multi-tenant org management, API access, and dedicated support for national-scale rollouts.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/dashboard">Request demo</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/organizations">Explore organizations</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t bg-foreground text-background">
        <div className="container flex flex-col items-start justify-between gap-6 py-14 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-brand">
              <Globe2 className="h-5 w-5" />
              <Lock className="h-5 w-5" />
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-display text-3xl tracking-tight">Ready to modernize credential trust?</h2>
            <p className="mt-2 max-w-xl text-background/70">
              Launch your verification portal in days, not quarters. Your learners, employers, and auditors will notice the difference.
            </p>
          </div>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/dashboard">
              Open platform <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
