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
  const [username, setUsername] = useState('')
  const [showUsernameForm, setShowUsernameForm] = useState(false)

  // Handle wallet connection
  const handleConnect = async () => {
    if (isAuthenticating) return
    try {
      await open()
    } catch (error) {
      console.error('Wallet connection error:', error)
    }
  }

  // Handle authentication after wallet connection
  useEffect(() => {
    let mounted = true

    const authenticate = async () => {
      // Prevent multiple simultaneous auth attempts
      if (isAuthenticating || !isConnected || !address) return

      console.log('Starting authentication with address:', address)
      setIsAuthenticating(true)

      try {
        // First check if user exists
        const checkRes = await fetch('/api/auth/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address }),
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
    if (isConnected && address && !isAuthenticating && !showUsernameForm) {
      // Add a small delay to ensure wallet is fully initialized
      setTimeout(authenticate, 500)
    }

    return () => {
      mounted = false
    }
  }, [address, isConnected, router])

  const handleSubmitUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !username.trim() || isAuthenticating) return

    setIsAuthenticating(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, username }),
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
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Laugh className="w-10 h-10" />
            HeheMeme
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
          <button
            onClick={handleConnect}
            className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 text-lg"
            disabled={isAuthenticating}
          >
            <WalletIcon className="w-6 h-6" />
            {isAuthenticating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              'Connect Wallet'
            )}
          </button>
        )}

        <div className="space-y-4 mt-12">
          <div className="flex items-center gap-3 text-gray-400">
            <Trophy className="w-6 h-6" />
            <span>Earn points by creating viral memes</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <MessageCircle className="w-6 h-6" />
            <span>Join the meme community</span>
          </div>
        </div>
      </div>
    </div>
  )
}
