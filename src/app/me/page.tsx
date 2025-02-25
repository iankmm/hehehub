'use client'

import { useEffect, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Copy, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import AuthWrapper from '@/components/AuthWrapper'

interface User {
  id: string
  username: string
  address: string
  heheScore: number
}

interface Post {
  id: string
  imageUrl: string
  caption: string
  createdAt: string
  user: {
    username: string
    heheScore: number
  }
  _count: {
    likes: number
  }
}

export default function MePage() {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { address, connector, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()

  const fetchPosts = async (page: number) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found')
        router.push('/login')
        return
      }

      console.log('Fetching posts with token:', token)
      const res = await fetch(`/api/posts/user?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      console.log('Received posts:', data)
      
      if (data.error) {
        throw new Error(data.error)
      }

      setPosts(data.posts || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching posts:', error)
      if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
        router.push('/login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    disconnect()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  useEffect(() => {
    const initializePage = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        const token = localStorage.getItem('token')
        
        if (!storedUser || !token) {
          console.log('No user or token found')
          router.push('/login')
          return
        }

        const parsedUser = JSON.parse(storedUser)
        if (parsedUser && typeof parsedUser === 'object' && 
            'id' in parsedUser && 
            'username' in parsedUser && 
            'address' in parsedUser && 
            'heheScore' in parsedUser) {
          setUser(parsedUser)
          await fetchPosts(1)
        } else {
          console.error('Invalid user data format')
          handleLogout()
        }
      } catch (error) {
        console.error('Error initializing page:', error)
        handleLogout()
      }
    }

    initializePage()
  }, [])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-[#1f1f1f] text-white p-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile Section */}
          <div className="bg-[#2f2f2f] rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">{user.username}</h1>
                <div className="flex items-center space-x-2 text-[#898989]">
                  <span className="text-sm truncate max-w-[200px]">{user.address}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(user.address)}
                    className="hover:text-white transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                  <a
                    href={`https://sepolia.explorer.zksync.io/address/${user.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                {connector?.name === 'zkSync SSO' ? (
                  <span className="text-sm text-blue-400 mt-2 block">Connected with zkSync SSO</span>
                ) : (
                  <div className="mt-2">
                    <span className="text-sm text-blue-400 block">Connected with Wallet</span>
                    <span className="text-xs text-[#898989]">Network: {chain?.name || 'Unknown'}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg 
                  bg-[#1f1f1f] hover:bg-[#2a2a2a] transition-colors border border-[#3f3f3f]"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Posts Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative group aspect-square"
                >
                  <Image
                    src={post.imageUrl}
                    alt={post.caption}
                    fill
                    className="object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 transition-all duration-300 flex items-center justify-center rounded-lg">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center p-4">
                      <p className="text-white">{post.caption}</p>
                      <p className="text-gray-300 mt-2">❤️ {post._count.likes}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center min-h-[200px]">
              <p className="text-gray-400">No posts found.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={() => fetchPosts(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchPosts(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthWrapper>
  )
}
