import { http, createConfig } from 'wagmi'
import { zksyncSepoliaTestnet, baseSepolia } from 'viem/chains'
import { defaultWagmiConfig } from '@web3modal/wagmi'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { injected } from 'wagmi/connectors'

const projectId = 'f746603fbed4b93dcf0b83046062097e'

const metadata = {
  name: 'HEHE Meme App',
  description: 'A social meme app powered by zkSync',
  url: 'http://localhost:3000',
  icons: ['/logo.png']
}

// Configure RPC URLs
const zkSyncRpcUrl = 'https://sepolia.era.zksync.dev'
const baseSepoliaRpcUrl = process.env.BASE_RPC_URL || 'https://base-sepolia.g.alchemy.com/v2/I48lGBdelPSEVhpzmy0K153sVBX5DbjH'

// Configure chains with RPC URLs
const configuredZkSync = {
  ...zksyncSepoliaTestnet,
  rpcUrls: {
    ...zksyncSepoliaTestnet.rpcUrls,
    default: { http: [zkSyncRpcUrl] },
    public: { http: [zkSyncRpcUrl] },
  }
}

const configuredBaseSepolia = {
  ...baseSepolia,
  rpcUrls: {
    ...baseSepolia.rpcUrls,
    default: { http: [baseSepoliaRpcUrl] },
    public: { http: [baseSepoliaRpcUrl] },
  }
}

// Configure chains
const chains = [configuredBaseSepolia]

// Create wagmi config
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  transports: {
    [configuredBaseSepolia.id]: http(baseSepoliaRpcUrl),
  },
  connectors: [
    injected({
      target: 'metaMask',
      shimDisconnect: true,
    }),
  ],
})

// Initialize web3modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains,
  defaultChain: configuredBaseSepolia,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#3b82f6', // blue-500
  },
})

export function getConfig() {
  return config
}

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
