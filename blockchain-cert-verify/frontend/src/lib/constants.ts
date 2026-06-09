export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0xCfEB869F69431e42cdB54A4F4f105C19C080A601"

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:7545"

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 1337

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

export const SUPPORTED_CHAINS = [
  { id: 1337, name: "Ganache Local", currency: "ETH" },
  { id: 11155111, name: "Sepolia Testnet", currency: "SepoliaETH" },
  { id: 1, name: "Ethereum Mainnet", currency: "ETH" },
]

export const SITE_CONFIG = {
  name: "CertVault",
  description: "Enterprise credential infrastructure for universities, governments, and certification authorities.",
  tagline: "Issue once. Verify anywhere.",
  url: "https://certvault.io",
  links: {
    github: "https://github.com/anomalyco/blockchain-cert-verify",
  },
}

export const ROLES = {
  ADMIN: "admin",
  UNIVERSITY_STAFF: "university_staff",
  STUDENT: "student",
} as const

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin", "university_staff"] },
  { href: "/issue", label: "Issue Certificate", roles: ["admin", "university_staff"] },
  { href: "/verify", label: "Verify", roles: ["admin", "university_staff", "student"] },
  { href: "/privacy", label: "Privacy Tools", roles: ["admin", "university_staff"] },
] as const
