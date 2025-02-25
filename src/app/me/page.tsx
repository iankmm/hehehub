'use client'

import { useEffect, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Copy, ExternalLink } from 'lucide-react'

interface User {
  username: string
  address: string
}

export default function MePage() {
  const [user, setUser] = useState<User | null>(null)
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    } else {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    disconnect()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#121212] pb-20">
      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1f1f1f] rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">
              {user.username}
            </h1>
            <button
              onClick={handleLogout}
              className="text-[#898989] hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Wallet Address */}
          <div className="flex items-center space-x-2 text-sm text-[#898989]">
            <span className="font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button
              onClick={copyAddress}
              className="hover:text-white transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
            <a
              href={`https://explorer.zksync.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bg-[#1f1f1f] rounded-xl p-4">
            <h3 className="text-sm font-medium text-[#898989]">Memes Posted</h3>
            <p className="text-2xl font-bold text-white mt-1">0</p>
          </div>
          <div className="bg-[#1f1f1f] rounded-xl p-4">
            <h3 className="text-sm font-medium text-[#898989]">Likes Received</h3>
            <p className="text-2xl font-bold text-white mt-1">0</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
