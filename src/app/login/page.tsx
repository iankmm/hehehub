'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useConnect } from 'wagmi'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      if (isConnected && address) {
        setIsLoading(true)
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address }),
          })

          const data = await res.json()

          if (res.ok) {
            // User exists, store token and redirect to home
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            router.push('/')
          } else if (data.needsUsername) {
            // New user, store address and redirect to signup
            localStorage.setItem('userAddress', address)
            router.push('/signup')
          }
        } catch (error) {
          console.error('Auth error:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    checkUser()
  }, [isConnected, address, router])

  const handleConnect = async () => {
    const connector = connectors[0]
    if (connector) {
      await connect({ connector })
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-white mb-3">Welcome to HEHE HUB!!!</h1>
        <p className="text-[#898989] text-lg">
          {isLoading ? 'Checking your account...' : 'Connect your wallet to continue'}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="px-6 py-3 bg-[#1f1f1f] text-white rounded-lg hover:bg-[#2f2f2f] 
                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Checking...' : 'Connect Wallet'}
        </button>
      </motion.div>
    </div>
  )
}
