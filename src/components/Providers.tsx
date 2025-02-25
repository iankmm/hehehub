'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getConfig } from '@/lib/wagmi'
import { Web3Modal } from '@web3modal/react'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { useState, useEffect } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

const config = getConfig()

// Initialize web3modal
createWeb3Modal({
  wagmiConfig: config,
  projectId: 'f746603fbed4b93dcf0b83046062097e',
  enableAnalytics: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#3b82f6', // blue-500
  },
})

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {mounted && children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
