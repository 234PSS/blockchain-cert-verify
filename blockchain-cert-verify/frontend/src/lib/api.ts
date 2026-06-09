import { API_URL } from "@/lib/constants"

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("certvault_token")
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) localStorage.setItem("certvault_token", token)
  else localStorage.removeItem("certvault_token")
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = await res.text()
    }
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: string }).message)
        : `Request failed (${res.status})`
    throw new ApiError(message, res.status, body)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "")

export const api = {
  health: () =>
    fetch(`${API_ORIGIN}/health`).then(async (res) => {
      if (!res.ok) throw new ApiError("Health check failed", res.status)
      return res.json() as Promise<{ status: string }>
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: Record<string, unknown> }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  profile: () => request<Record<string, unknown>>("/auth/profile"),

  verifyCertificate: (certificateId: string) =>
    request<Record<string, unknown>>(`/certificates/verify/${certificateId}`),

  listCertificates: () =>
    request<{ certificates: Record<string, unknown>[] }>("/certificates/all"),

  listIssuers: () =>
    request<{ issuers: Record<string, unknown>[] }>("/certificates/issuers"),
}
