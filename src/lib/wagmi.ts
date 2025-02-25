import { http } from 'wagmi'
import { zksyncSepoliaTestnet } from 'viem/chains'
import { 
  injected, 
  metaMask, 
  walletConnect,
  coinbaseWallet 
} from 'wagmi/connectors'
import { zksyncSsoConnector } from 'zksync-sso/connector'
import { defaultWagmiConfig } from '@web3modal/wagmi'

const projectId = 'f746603fbed4b93dcf0b83046062097e'

const metadata = {
  name: 'HEHE Meme App',
  description: 'A social meme app powered by zkSync',
  url: 'http://localhost:3000',
  icons: ['/logo.png']
}

const ssoConnector = zksyncSsoConnector({
  metadata,
  options: {
    preferPasskey: true, // Prioritize passkey authentication
    skipAccountSelect: true, // Skip account selection if only one account
  }
})

export function getConfig() {
  return defaultWagmiConfig({
    chains: [zksyncSepoliaTestnet],
    projectId,
    metadata,
    connectors: [
      ssoConnector,
      metaMask(),
      walletConnect({ projectId }),
      coinbaseWallet({ appName: metadata.name }),
      injected({
        shimDisconnect: true,
      }),
    ],
    transports: {
      [zksyncSepoliaTestnet.id]: http(
        'https://sepolia.era.zksync.dev'
      ),
    },
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
