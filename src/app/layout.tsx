'use client'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import BottomNav from '@/components/BottomNav'
import { ThirdwebProvider } from "thirdweb/react";
import { AutoConnect } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
// import { baseSepolia } from "thirdweb/chains";
import { selectedChain } from "@/lib/chains";
import { createThirdwebClient } from 'thirdweb'
import Script from 'next/script' // <-- import Script


const inter = Inter({ subsets: ['latin'] })

const client = createThirdwebClient({
  clientId: "8e1035b064454b1b9505e0dd626a8555"
})

const metadata = {
  title: 'HEHE - Social Meme App',
  description: 'Share and discover the best memes on zkSync',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Load face-api.min.js BEFORE interactive so that it's ready when needed */}
        <Script
          src="/face-api.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <ThirdwebProvider>
          <div className="min-h-screen flex flex-col">
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <AutoConnect
                  client={client}
                  accountAbstraction={{
                    chain: selectedChain,
                    sponsorGas: true,
                  }}
                />
              </div>
            </div>
            <main className="flex-1">
              {children}
            </main>
            <BottomNav />
          </div>
        </ThirdwebProvider>
      </body>
    </html>
  ) 
}
