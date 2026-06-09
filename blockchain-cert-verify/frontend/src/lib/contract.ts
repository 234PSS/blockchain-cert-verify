import { ethers } from "ethers"
import { CertificateRegistryABI } from "@/lib/abi"
import { CONTRACT_ADDRESS, RPC_URL, CHAIN_ID } from "@/lib/constants"
import type { Certificate, Issuer, VerificationResult, WalletState } from "@/types"

let provider: ethers.JsonRpcProvider | null = null
let contract: ethers.Contract | null = null
let signer: ethers.Signer | null = null

export function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID, {
      staticNetwork: true,
    })
  }
  return provider
}

export function getContract(useSigner = false): ethers.Contract {
  if (useSigner && signer) {
    return new ethers.Contract(CONTRACT_ADDRESS, CertificateRegistryABI, signer)
  }
  if (!contract) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, CertificateRegistryABI, getProvider())
  }
  return contract
}

export async function connectWallet(): Promise<WalletState> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    return { address: null, chainId: null, isConnected: false, isCorrectChain: false }
  }

  const eth = (window as any).ethereum
  try {
    const accounts: string[] = await eth.request({ method: "eth_requestAccounts" })
    const chainIdHex: string = await eth.request({ method: "eth_chainId" })
    const chainId = parseInt(chainIdHex, 16)

    signer = await new ethers.BrowserProvider(eth).getSigner()
    contract = null

    return {
      address: accounts[0] ?? null,
      chainId,
      isConnected: accounts.length > 0,
      isCorrectChain: chainId === CHAIN_ID,
    }
  } catch {
    return { address: null, chainId: null, isConnected: false, isCorrectChain: false }
  }
}

export function getSigner(): ethers.Signer | null {
  return signer
}

export async function getDashboardData(): Promise<{
  totalCertificates: number
  totalIssuers: number
  issuers: Issuer[]
  certificateIds: string[]
  paused: boolean
}> {
  const c = getContract()
  const [count, issuerCount, issuersData, paused] = await Promise.all([
    c.getCertificateCount(),
    c.getIssuerCount(),
    c.getAllIssuers(),
    c.paused(),
  ])

  const certificateIds: string[] = []
  for (let i = 0; i < Math.min(Number(count), 100); i++) {
    certificateIds.push(await c.getCertificateAt(i))
  }

  const [addresses, issuerStructs] = issuersData
  const issuers: Issuer[] = addresses.map((addr: string, i: number) => ({
    wallet: addr,
    name: issuerStructs[i].name,
    domain: issuerStructs[i].domain,
    active: issuerStructs[i].active,
    registeredAt: Number(issuerStructs[i].registeredAt),
  }))

  return {
    totalCertificates: Number(count),
    totalIssuers: Number(issuerCount),
    issuers,
    certificateIds,
    paused,
  }
}

export async function verifyCertificateOnChain(
  certificateId: string
): Promise<VerificationResult> {
  const c = getContract()
  const [valid, certificateHash, issuer, issuedAt, revoked] =
    await c.verifyCertificate(certificateId)
  return {
    valid,
    certificateHash,
    issuer,
    issuedAt: Number(issuedAt),
    revoked,
  }
}

export async function issueCertificate(
  studentId: string,
  courseId: string,
  graduationDate: number,
  certificateHash: string
) {
  if (!signer) throw new Error("Wallet not connected")
  const c = getContract(true)

  const certId = await c.computeCertificateId(studentId, courseId, graduationDate)
  const hashBytes = ethers.keccak256(ethers.toUtf8Bytes(certificateHash))

  const tx = await c.issueCertificate(certId, hashBytes)
  const receipt = await tx.wait()

  return { certificateId: certId, receipt, txHash: receipt.hash }
}

export async function issueCertificatesBatch(
  items: { studentId: string; courseId: string; graduationDate: number; certificateHash: string }[]
) {
  if (!signer) throw new Error("Wallet not connected")
  const c = getContract(true)

  const ids: string[] = []
  const hashes: string[] = []

  for (const item of items) {
    const id = await c.computeCertificateId(item.studentId, item.courseId, item.graduationDate)
    ids.push(id)
    hashes.push(ethers.keccak256(ethers.toUtf8Bytes(item.certificateHash)))
  }

  const tx = await c.issueCertificatesBatch(ids, hashes)
  const receipt = await tx.wait()

  return { certificateIds: ids, receipt, txHash: receipt.hash }
}

export async function updateMerkleRoot(root: string) {
  if (!signer) throw new Error("Wallet not connected")
  const c = getContract(true)
  const tx = await c.updateMerkleRoot(root)
  const receipt = await tx.wait()
  return { receipt, txHash: receipt.hash }
}

export async function verifyMerkleProof(
  leaf: string,
  proof: string[],
  issuerAddress: string
): Promise<boolean> {
  const c = getContract()
  return c.verifyByMerkleProof(leaf, proof, issuerAddress)
}

export async function consumeNullifier(nullifier: string) {
  if (!signer) throw new Error("Wallet not connected")
  const c = getContract(true)
  const tx = await c.consumeNullifier(nullifier)
  const receipt = await tx.wait()
  return { receipt, txHash: receipt.hash }
}

export async function registerIssuer(name: string, domain: string) {
  if (!signer) throw new Error("Wallet not connected")
  const c = getContract(true)
  const tx = await c.registerIssuer(name, domain)
  const receipt = await tx.wait()
  return { receipt, txHash: receipt.hash }
}

export async function switchToCorrectChain(): Promise<boolean> {
  if (typeof window === "undefined") return false
  const eth = (window as any).ethereum
  if (!eth) return false

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
    })
    return true
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${CHAIN_ID.toString(16)}`,
              chainName: CHAIN_ID === 1337 ? "Ganache Local" : "Custom Network",
              rpcUrls: [RPC_URL],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            },
          ],
        })
        return true
      } catch {
        return false
      }
    }
    return false
  }
}
