export interface Certificate {
  certificateId: string
  certificateHash: string
  issuer: string
  issuedAt: number
  revoked: boolean
  studentName?: string
  courseName?: string
  institutionName?: string
  grade?: string
  issuedAtFormatted?: string
}

export interface Issuer {
  wallet: string
  name: string
  domain: string
  active: boolean
  registeredAt: number
}

export interface IssuerStats {
  totalIssued: number
  totalRevoked: number
  activeCount: number
  merkleRoot: string
  lastActivity: number
}

export interface DashboardData {
  totalCertificates: number
  totalIssuers: number
  totalRevoked: number
  issuanceByMonth: { month: string; count: number }[]
  recentActivity: ActivityItem[]
  issuerBreakdown: { name: string; count: number }[]
  contractPaused: boolean
  chainId: number
}

export interface ActivityItem {
  type: 'issue' | 'revoke' | 'merkle' | 'pause' | 'register'
  hash: string
  timestamp: number
  description: string
}

export interface MerkleProof {
  leaf: string
  proof: string[]
  root: string
  salt?: string
}

export interface SelectiveDisclosureProof {
  root: string
  revealed: {
    key: string
    value: string
    leaf: string
    proof: string[]
  }[]
  fieldCount: number
}

export interface BatchUploadItem {
  studentName: string
  studentId: string
  courseName: string
  courseCode: string
  graduationDate: string
  grade: string
  file?: File
}

export interface ContractStatus {
  ready: boolean
  reason: string | null
  contractAddress: string | null
  walletAddress: string | null
}

export interface VerificationResult {
  valid: boolean
  certificateHash: string
  issuer: string
  issuedAt: number
  revoked: boolean
  merkleValid?: boolean
}

export interface WalletState {
  address: string | null
  chainId: number | null
  isConnected: boolean
  isCorrectChain: boolean
}
