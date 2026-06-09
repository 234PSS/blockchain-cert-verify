"use client"

import { useEffect, useState, useCallback } from "react"
import { connectWallet } from "@/lib/contract"
import type { WalletState } from "@/types"

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isCorrectChain: false,
  })
  const [connecting, setConnecting] = useState(false)

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      const state = await connectWallet()
      setWallet(state)
    } finally {
      setConnecting(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const eth = (window as any).ethereum
    if (!eth) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWallet({ address: null, chainId: null, isConnected: false, isCorrectChain: false })
      } else {
        connect()
      }
    }

    const handleChainChanged = () => {
      connect()
    }

    eth.on("accountsChanged", handleAccountsChanged)
    eth.on("chainChanged", handleChainChanged)

    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged)
      eth.removeListener("chainChanged", handleChainChanged)
    }
  }, [connect])

  return { wallet, connecting, connect }
}
