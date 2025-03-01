'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Copy, ExternalLink, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { useDisconnect, useActiveWallet, useActiveAccount, useReadContract,  } from "thirdweb/react"
import { createThirdwebClient, getContract, prepareContractCall, sendTransaction, waitForReceipt} from "thirdweb"
import { baseSepolia } from "thirdweb/chains"
import ImageReel from '@/components/ImageReel'

const client = createThirdwebClient({
  clientId: "8e1035b064454b1b9505e0dd626a8555"
});

const contract = getContract({
  client,
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
  chain: baseSepolia,
});

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
  likes: number
  username: string
  heheScore: number
  hasLiked: boolean
  createdAt: string
  reaction_image_url?: string
  user?: {
    username: string
    heheScore: number
  }
}

interface NFT {
  tokenId: string
  imageUrl: string
  burnEligible?: boolean
  postLikes?: number
}

type Tab = 'posts' | 'nfts' | 'liked'

export default function MePage() {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [nfts, setNfts] = useState<NFT[]>([])
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState<Tab>('posts')
  const [currentNftIndex, setCurrentNftIndex] = useState<number>(0)
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(true)
  const [flippedPostId, setFlippedPostId] = useState<string | null>(null)
  const [showScoreNotification, setShowScoreNotification] = useState(false);
  const [earnedScore, setEarnedScore] = useState(0);
  const [burningNftId, setBurningNftId] = useState<string | null>(null);
  
  const activeAccount = useActiveAccount()
  const { disconnect } = useDisconnect()
  const wallet = useActiveWallet()
  const router = useRouter()

  // NFT Contract Hooks
  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    contract,
    method: "function balanceOf(address owner) view returns (uint256)",
    params: activeAccount ? [activeAccount.address] : undefined,
  })

  const { data: tokenId, isLoading: isLoadingTokenId } = useReadContract({
    contract,
    method: "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    params: activeAccount && typeof currentNftIndex === 'number' ? [activeAccount.address, BigInt(currentNftIndex)] : undefined,
  })

  const { data: memeUrl, isLoading: isLoadingMemeUrl } = useReadContract({
    contract,
    method: "function getMemeUrl(uint256 tokenId) view returns (string)",
    params: tokenId ? [tokenId] : undefined,
  })

  // Effect for NFT loading
  useEffect(() => {
    if (!activeAccount?.address) {
      setNfts([])
      setIsLoadingNFTs(false)
      return
    }

    if (!isLoadingBalance && !balance) {
      setNfts([])
      setIsLoadingNFTs(false)
      return
    }

    setIsLoadingNFTs(true)
  }, [activeAccount?.address, balance, isLoadingBalance])

  useEffect(() => {
    if (!balance || isLoadingBalance || currentNftIndex >= (balance ? Number(balance) : 0)) {
      return
    }

    if (!isLoadingTokenId && !isLoadingMemeUrl && tokenId && memeUrl) {
      // Find matching post with over 3 heheScore
      console.log('all posts', allPosts)
      const matchingPost = allPosts.find(post => {
        console.log('Comparing:', {
          postUrl: post.imageUrl,
          nftUrl: memeUrl,
          heheScore: post.heheScore,
          likes: post.likes
        })
        return post.imageUrl === memeUrl && post.likes > 3
      })
      console.log('Found matching post:', matchingPost)
      
      setNfts(prev => {
        const newNft = {
          tokenId: tokenId.toString(),
          imageUrl: memeUrl,
          burnEligible: !!matchingPost,
          postLikes: matchingPost ? matchingPost.likes : 0
        }
        console.log('Adding NFT with likes:', newNft)
        return [...prev, newNft]
      })

      // Move to next NFT or finish
      if (currentNftIndex + 1 < (balance ? Number(balance) : 0)) {
        setCurrentNftIndex(currentNftIndex + 1)
      } else {
        setIsLoadingNFTs(false)
      }
    }
  }, [balance, isLoadingBalance, currentNftIndex, tokenId, memeUrl, isLoadingTokenId, isLoadingMemeUrl, allPosts])

  useEffect(() => {
    console.log('Current NFTs:', nfts)
  }, [nfts])

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
    } catch (error: any) {
      console.error('Error fetching posts:', error)
      if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
        router.push('/login')
      }
    } finally {
      setIsLoading(false)
      setIsInitializing(false)
    }
  }

  const fetchLikedPosts = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/me/liked', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        console.log("liked posts data", data)
        setLikedPosts(data)
      }
    } catch (error) {
      console.error('Error fetching liked posts:', error)
    }
  }

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found')
        router.push('/login')
        return
      }

      const res = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      if (data.error) {
        throw new Error(data.error)
      }

      setUser(data)
      // Update local storage with fresh user data
      localStorage.setItem('user', JSON.stringify(data))
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchAllPosts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return;
      
      const res = await fetch('/api/posts/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        console.log('Fetched posts:', data.posts)
        setAllPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching all posts:', error)
    }
  }

  useEffect(() => {
    fetchAllPosts()
  }, [])

  const handleLogout = () => {
    if (wallet) {
      disconnect(wallet)
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const handleBurnNFT = async (tokenId: string, likes: number) => {
    if (burningNftId) return; // Prevent multiple burns
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setBurningNftId(tokenId);
      const burnAddress = "0x000000000000000000000000000000000000dEaD";

      // Prepare the transfer transaction
      const transferTransaction = await prepareContractCall({
        contract,
        method: "function transferFrom(address from, address to, uint256 tokenId)",
        params: [
          activeAccount?.address || "",
          burnAddress,
          BigInt(tokenId)
        ]
      });

      let { transactionHash } = await sendTransaction({
        account: activeAccount!,
        transaction: transferTransaction,
      });

      const receipt = await waitForReceipt({
        client,
        chain: baseSepolia,
        transactionHash,
      });

      if (receipt.status === 'success') {
        // Then update user's heheScore
        const heheScoreIncrease = Math.floor(likes / 2);
        const res = await fetch('/api/users/updateScore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            scoreIncrease: heheScoreIncrease
          })
        });

        if (res.ok) {
          // Update local state
          setNfts(prev => prev.filter(nft => nft.tokenId !== tokenId));
          if (user) {
            setUser({
              ...user,
              heheScore: user.heheScore + heheScoreIncrease
            });
          }
          
          // Show score notification
          setEarnedScore(heheScoreIncrease);
          setShowScoreNotification(true);
          setTimeout(() => setShowScoreNotification(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error burning NFT:', error);
    } finally {
      setBurningNftId(null);
    }
  };

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
        setUser(parsedUser)
        
        // Fetch fresh user data and posts
        await Promise.all([
          fetchUserData(),
          fetchPosts(1),
          fetchLikedPosts()
        ])
      } catch (error) {
        console.error('Error initializing page:', error)
        router.push('/login')
      }
    }

    initializePage()

    // Set up periodic refresh of user data
    const refreshInterval = setInterval(fetchUserData, 10000) // Refresh every 10 seconds

    return () => {
      clearInterval(refreshInterval)
    }
  }, [router])

  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-[#1f1f1f] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#1f1f1f]">
      {/* Success Notification */}
      <AnimatePresence>
        {showScoreNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-pink-500 text-white px-6 py-4 rounded-lg shadow-xl">
              <p className="text-xl font-bold">+{earnedScore} HEHE Score!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Header Section */}
      <div className="sticky top-0 left-0 right-0 z-10 bg-[#1f1f1f]">
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 h-48 bg-gradient-to-b from-pink-500/20 to-transparent" />
          
          {/* Profile Content */}
          <div className="relative pt-12 px-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-white">Profile</h1>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>

            {user && (
              <div className="space-y-6">
                {/* Username and HEHE Score */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">
                    {user.username}
                  </h2>
                  <p className="text-pink-400">HEHE Score: {user.heheScore}</p>
                </div>

                {/* Wallet Address */}
                <div className="p-4 bg-[#2f2f2f] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Wallet Address</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(user.address)
                        }}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                      <a
                        href={`https://sepolia.basescan.org/address/${user.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                  <p className="text-sm text-white break-all">
                    {user.address}
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 border-b border-[#2f2f2f]">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
                      activeTab === 'posts' ? 'text-pink-500' : 'text-gray-400'
                    }`}
                  >
                    Posts
                    {activeTab === 'posts' && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500"
                        initial={false}
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('nfts')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
                      activeTab === 'nfts' ? 'text-pink-500' : 'text-gray-400'
                    }`}
                  >
                    NFTs
                    {activeTab === 'nfts' && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500"
                        initial={false}
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('liked')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
                      activeTab === 'liked' ? 'text-pink-500' : 'text-gray-400'
                    }`}
                  >
                    Liked
                    {activeTab === 'liked' && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500"
                        initial={false}
                      />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-8 pb-24">
          {activeTab === 'posts' && (
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="space-y-4 text-center">
                    <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-white">Loading posts...</p>
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No posts yet</p>
                </div>
              ) : (
                <ImageReel 
                  images={posts} 
                  onEndReached={() => {}} 
                />
              )}
            </div>
          )}

          {activeTab === 'nfts' && (
            <div className="grid grid-cols-2 gap-4 p-4 overflow-y-auto">
              {isLoadingNFTs ? (
                // Loading skeleton
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-800 rounded-lg aspect-square"></div>
                ))
              ) : nfts.length > 0 ? (
                nfts.map((nft, index) => (
                  <div key={`nft-${nft.tokenId}-${index}`} className="relative group">
                    <div className="relative rounded-xl overflow-hidden aspect-square">
                      <Image
                        src={nft.imageUrl}
                        alt={`NFT ${nft.tokenId}`}
                        fill
                        className="object-cover"
                      />
                      {nft.burnEligible && (
                        <div className="absolute inset-0 border-[4px] border-pink-500 rounded-xl glow-pink"></div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-sm">{nft.postLikes} likes</p>
                      </div>
                    </div>
                    {nft.burnEligible && (
                      <button
                        onClick={() => handleBurnNFT(nft.tokenId, nft.postLikes || 0)}
                        disabled={burningNftId === nft.tokenId}
                        className={`absolute bottom-2 right-2 bg-pink-500 text-white px-3 py-1 rounded-full 
                                    text-sm font-medium transition-all duration-200 flex items-center space-x-1.5
                                    ${burningNftId === nft.tokenId ? 
                                      'opacity-75 cursor-not-allowed' : 
                                      'hover:bg-pink-600'}`}
                      >
                        {burningNftId === nft.tokenId ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Burning...</span>
                          </>
                        ) : (
                          <>
                            <span>🔥</span>
                            <span>{Math.floor((nft.postLikes || 0) / 2)}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-400">
                  No NFTs found
                </div>
              )}
            </div>
          )}

          {activeTab === 'liked' && (
            <div>
              {likedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="space-y-2">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-gray-400">No liked posts yet</p>
                    <p className="text-sm text-gray-500">
                      Start HEHE-ing at some memes to see them here!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {likedPosts.map((post) => {
                    const flipped = flippedPostId === post.id;

                    return (
                      <div
                        key={post.id}
                        className="relative w-full pb-[100%]"
                        style={{ perspective: '1000px' }}
                        onClick={() => setFlippedPostId(flipped ? null : post.id)}
                      >
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            transformStyle: 'preserve-3d',
                          }}
                          animate={{ rotateY: flipped ? 180 : 0 }}
                          transition={{
                            duration: 0.6,
                            type: 'spring',
                            stiffness: 260,
                            damping: 20
                          }}
                        >
                          {/* FRONT SIDE */}
                          <div
                            className="absolute inset-0 bg-[#2f2f2f] rounded-lg overflow-hidden"
                            style={{
                              backfaceVisibility: 'hidden',
                            }}
                          >
                            <img
                              src={post.imageUrl}
                              alt={post.caption}
                              className="w-full h-full object-cover"
                            />
                            {/* Always visible overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                              <div className="absolute bottom-0 left-0 right-0 p-4">
                                <p className="text-white font-medium mb-1">
                                  @{post.user?.username || post.username}
                                </p>
                                {post.caption && (
                                  <p className="text-sm text-white/80 line-clamp-2 pr-12">
                                    {post.caption}
                                  </p>
                                )}
                                <div className="absolute bottom-4 right-4 flex items-center space-x-1 
                                              bg-black/40 rounded-full px-2 py-1">
                                  <span className="text-sm">🤣</span>
                                  <span className="text-sm text-white">{post.likes}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* BACK SIDE */}
                          <div
                            className="absolute inset-0 bg-[#2f2f2f] rounded-lg overflow-hidden"
                            style={{
                              backfaceVisibility: 'hidden',
                              transform: 'rotateY(180deg)'
                            }}
                          >
                            {post.reaction_image_url ? (
                              <img
                                src={post.reaction_image_url}
                                alt="Your reaction"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white">
                                No reaction image
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}