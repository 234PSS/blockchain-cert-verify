import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  Search,
  BarChart3,
  Settings,
  FileBadge,
  Sparkles,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  description?: string
  icon: LucideIcon
  badge?: string
}

export const PLATFORM_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "University-wide credential metrics",
    icon: LayoutDashboard,
  },
  {
    href: "/issuer",
    label: "Issuer",
    description: "Issue and manage credentials",
    icon: FileBadge,
  },
  {
    href: "/verify",
    label: "Verify",
    description: "Instant credential verification",
    icon: ShieldCheck,
  },
  {
    href: "/explorer",
    label: "Explorer",
    description: "Search issued credentials",
    icon: Search,
  },
  {
    href: "/analytics",
    label: "Analytics",
    description: "Issuance trends and insights",
    icon: BarChart3,
  },
  {
    href: "/organizations",
    label: "Organizations",
    description: "Manage institutions and issuers",
    icon: Building2,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Account and platform preferences",
    icon: Settings,
  },
] as const

export const SECONDARY_PLATFORM_NAV: NavItem[] = [
  {
    href: "/privacy",
    label: "Privacy",
    description: "Selective disclosure utilities",
    icon: Sparkles,
  },
]

export const MARKETING_NAV = [
  { href: "/#product", label: "Product" },
  { href: "/#security", label: "Security" },
  { href: "/verify", label: "Verify" },
  { href: "/#pricing", label: "Pricing" },
] as const

export const PRODUCT_HIGHLIGHTS = [
  {
    title: "Institution-grade trust",
    description: "Every credential is cryptographically anchored with audit-ready verification logs.",
    icon: ShieldCheck,
  },
  {
    title: "Privacy by design",
    description: "Selective disclosure and Merkle commitments protect learner data by default.",
    icon: Sparkles,
  },
  {
    title: "Built for scale",
    description: "Batch issuance, multi-tenant orgs, and analytics designed for national deployments.",
    icon: BarChart3,
  },
] as const
