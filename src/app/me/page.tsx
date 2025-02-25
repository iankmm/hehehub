'use client'

import { useEffect, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Copy, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import AuthWrapper from '@/components/AuthWrapper'

interface User {
  username: string
  address: string
}

interface Post {
  id: string
  imageUrl: string
  caption: string
  likes: number
  username: string
  heheScore: number
  hasLiked: boolean
  createdAt: string
}

interface PostsResponse {
  posts: Post[]
  totalPages: number
  currentPage: number
}

export default function MePage() {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()

  const fetchPosts = async (page: number) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(`/api/me/posts?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data: PostsResponse = await res.json()
        if (page === 1) {
          setPosts(data.posts)
        } else {
          setPosts(prevPosts => [...prevPosts, ...data.posts])
        }
        setTotalPages(data.totalPages)
        setCurrentPage(data.currentPage)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      fetchPosts(1)
    } else {
      router.push('/login')
    }
  }, [router])

  const handleLoadMore = () => {
    if (!isLoading && currentPage < totalPages) {
      fetchPosts(currentPage + 1)
    }
  }

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
    <AuthWrapper>
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
              <p className="text-2xl font-bold text-white mt-1">{posts.length}</p>
            </div>
            <div className="bg-[#1f1f1f] rounded-xl p-4">
              <h3 className="text-sm font-medium text-[#898989]">Total Likes</h3>
              <p className="text-2xl font-bold text-white mt-1">
                {posts.reduce((sum, post) => sum + post.likes, 0)}
              </p>
            </div>
          </motion.div>

          {/* Posts Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-white">Your Memes</h2>
            <div className="grid grid-cols-2 gap-4">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-square bg-[#1f1f1f] rounded-xl overflow-hidden group"
                >
                  <Image
                    src={post.imageUrl}
                    alt={post.caption}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div className="text-white">
                      <p className="text-sm">{post.likes} likes</p>
                      <p className="text-xs text-gray-300 mt-1">{post.caption}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {currentPage < totalPages && !isLoading && (
              <button
                onClick={handleLoadMore}
                className="w-full py-3 bg-[#1f1f1f] text-white rounded-xl hover:bg-[#2f2f2f] transition-colors"
              >
                Load More
              </button>
            )}
            {isLoading && (
              <div className="text-center py-4 text-[#898989]">
                Loading...
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AuthWrapper>
  )
}
