'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Laugh, MessageCircle, Trophy, WalletIcon } from 'lucide-react'
import { createThirdwebClient } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { ConnectButton, useActiveAccount, useActiveWalletConnectionStatus } from "thirdweb/react";

const client = createThirdwebClient({
  clientId: "8e1035b064454b1b9505e0dd626a8555"
});

interface User {
  username: string
  address: string
}

export default function LoginPage() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const activeAccount = useActiveAccount()
  const connectionStatus = useActiveWalletConnectionStatus()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [showUsernameForm, setShowUsernameForm] = useState(false)

  // Handle authentication after wallet connection
  useEffect(() => {
    let mounted = true

    const authenticate = async () => {
      // Prevent multiple simultaneous auth attempts
      if (isAuthenticating || connectionStatus !== 'connected' || !activeAccount?.address) return

      console.log('Starting authentication with address:', activeAccount.address)
      setIsAuthenticating(true)

      try {
        // First check if user exists
        const checkRes = await fetch('/api/auth/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address: activeAccount.address }),
        })

        // Only proceed if component is still mounted
        if (!mounted) return

        if (checkRes.ok) {
          const data = await checkRes.json()
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          // Add a small delay to ensure storage is updated
          await new Promise(resolve => setTimeout(resolve, 100))
          router.push('/')
        } else {
          // User doesn't exist, show username form
          setShowUsernameForm(true)
        }
      } catch (error) {
        console.error('Authentication error:', error)
        if (mounted) {
          setShowUsernameForm(false)
        }
      } finally {
        if (mounted) {
          setIsAuthenticating(false)
        }
      }
    }

    // Only attempt authentication if wallet is connected and we're not already authenticating
    if (connectionStatus === 'connected' && activeAccount?.address && !isAuthenticating && !showUsernameForm) {
      // Add a small delay to ensure wallet is fully initialized
      setTimeout(authenticate, 500)
    }

    return () => {
      mounted = false
    }
  }, [activeAccount?.address, connectionStatus, router])

  const handleSubmitUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAccount?.address || !username.trim() || isAuthenticating) return

    setIsAuthenticating(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: activeAccount.address, username }),
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push('/')
      } else {
        const errorData = await res.json()
        console.error('Username submission error:', errorData)
      }
    } catch (error) {
      console.error('Username submission error:', error)
    } finally {
      setIsAuthenticating(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 justify-center items-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Laugh className="w-10 h-10" />
            HeheHub
          </h1>
          <p className="text-gray-400 text-lg mb-8">Create and collect meme NFTs</p>
        </div>

        {showUsernameForm ? (
          <form onSubmit={handleSubmitUsername} className="space-y-4">
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-pink-500"
              disabled={isAuthenticating}
            />
            <button
              type="submit"
              className="w-full bg-pink-500 text-white py-2 px-4 rounded hover:bg-pink-600 transition-colors disabled:opacity-50"
              disabled={isAuthenticating || !username.trim()}
            >
              {isAuthenticating ? 'Setting up...' : 'Continue'}
            </button>
          </form>
        ) : (
          <div className="flex space-y-4 justify-center items-center">
            <ConnectButton
              client={client}
              accountAbstraction={{
                chain: baseSepolia,
                sponsorGas: true,
              }}
            />
          </div>
        )}

        <div className="mt-8 grid grid-cols-3 gap-4 text-center text-gray-400">
          <div className="flex flex-col items-center">
            <MessageCircle className="w-6 h-6 mb-2" />
            <p>Share Memes</p>
          </div>
          <div className="flex flex-col items-center">
            <Trophy className="w-6 h-6 mb-2" />
            <p>Earn Rewards</p>
          </div>
          <div className="flex flex-col items-center">
            <WalletIcon className="w-6 h-6 mb-2" />
            <p>Own NFTs</p>
          </div>
        </div>
      </div>
    </div>
  )
}
