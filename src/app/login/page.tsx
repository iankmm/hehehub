'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { Laugh, MessageCircle, Trophy, WalletIcon } from 'lucide-react'

interface User {
  username: string
  address: string
}

export default function LoginPage() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const { address, isConnected } = useAccount()
  const { open } = useWeb3Modal()
  const router = useRouter()

  // Check for existing token and redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user && isConnected) {
      router.push('/')
    }
  }, [router, isConnected])

  // Handle wallet connection and authentication
  const handleConnect = async () => {
    try {
      await open()
    } catch (error) {
      console.error('Wallet connection error:', error)
    }
  }

  // Handle authentication after wallet connection
  useEffect(() => {
    const authenticate = async () => {
      if (!isConnected || !address || isAuthenticating) return

      setIsAuthenticating(true)
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address }),
        })

        const data = await res.json()

        if (data.needsUsername) {
          router.push('/signup')
          return
        }

        if (data.token && data.user && typeof data.user === 'object') {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          router.push('/')
        } else {
          throw new Error('Invalid response data format')
        }
      } catch (error) {
        console.error('Authentication error:', error)
        setIsAuthenticating(false)
      }
    }

    authenticate()
  }, [isConnected, address, router])

  return (
    <div className="min-h-screen bg-[#1f1f1f] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-[#2f2f2f] p-4 rounded-full">
            <Laugh className="w-12 h-12 text-blue-400" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Welcome to HEHE</h1>
            <p className="mt-2 text-[#898989]">Share and discover the funniest memes in web3</p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-[#2f2f2f] rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3 text-white">
            <div className="bg-blue-400/10 p-2 rounded-lg">
              <Laugh className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium">Share Your Humor</h3>
              <p className="text-sm text-[#898989]">Post and share your favorite memes</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-white">
            <div className="bg-purple-400/10 p-2 rounded-lg">
              <MessageCircle className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium">Connect with Others</h3>
              <p className="text-sm text-[#898989]">Engage with a community of meme lovers</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-white">
            <div className="bg-green-400/10 p-2 rounded-lg">
              <Trophy className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-medium">Earn HEHE Score</h3>
              <p className="text-sm text-[#898989]">Get rewarded for your contributions</p>
            </div>
          </div>
        </div>

        {/* Connect Button */}
        <button
          onClick={handleConnect}
          disabled={isAuthenticating}
          className="w-full bg-[#2f2f2f] text-white py-3 px-4 rounded-lg
            border border-[#3f3f3f] hover:bg-[#2a2a2a] transition-colors
            flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isAuthenticating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Connecting...</span>
            </>
          ) : isConnected ? (
            <>
              <div className="w-5 h-5 border-2 border-green-400 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-400 rounded-full" />
              </div>
              <span>Wallet Connected - Authenticating...</span>
            </>
          ) : (
            <>
              <WalletIcon className="w-5 h-5" />
              <span>Connect Wallet to Start</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
