import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function bytes32ToString(hex: string): string {
  if (!hex || hex === "0x0000000000000000000000000000000000000000000000000000000000000000") {
    return ""
  }
  const bytes = hex.startsWith("0x") ? hex.slice(2) : hex
  let str = ""
  for (let i = 0; i < bytes.length; i += 2) {
    const code = parseInt(bytes.slice(i, i + 2), 16)
    if (code === 0) break
    str += String.fromCharCode(code)
  }
  return str
}

export function generateSalt(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")}`
}

export function parseBlockchainError(error: unknown): string {
  if (typeof error === "string") return error
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>
    return (
      (e.reason as string) ||
      (e.shortMessage as string) ||
      (e.message as string) ||
      "Unknown blockchain error"
    )
  }
  return "Unknown blockchain error"
}
