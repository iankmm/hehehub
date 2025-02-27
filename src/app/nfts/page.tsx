'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createThirdwebClient, getContract } from "thirdweb"
import { baseSepolia } from "thirdweb/chains"
import { useActiveAccount, useReadContract } from "thirdweb/react"

const client = createThirdwebClient({
  clientId: "8e1035b064454b1b9505e0dd626a8555"
});

const contract = getContract({
  client,
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
  chain: baseSepolia,
});

interface NFT {
  tokenId: string
  imageUrl: string
}

export default function NFTsPage() {
  const activeAccount = useActiveAccount()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(true)

  // Get user's NFT balance
  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    contract,
    method: "function balanceOf(address owner) view returns (uint256)",
    params: activeAccount ? [activeAccount.address] : undefined,
  })

  // Get token ID for current index
  const { data: tokenId, isLoading: isLoadingTokenId } = useReadContract({
    contract,
    method: "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    params: activeAccount ? [activeAccount.address, BigInt(currentIndex)] : undefined,
  })

  // Get meme URL for token ID
  const { data: memeUrl, isLoading: isLoadingMemeUrl } = useReadContract({
    contract,
    method: "function getMemeUrl(uint256 tokenId) view returns (string)",
    params: tokenId ? [tokenId] : undefined,
  })

  // Effect for balance loading
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

  // Effect for loading NFTs
  useEffect(() => {
    if (!balance || isLoadingBalance || currentIndex >= Number(balance)) {
      return
    }

    if (!isLoadingTokenId && !isLoadingMemeUrl && tokenId && memeUrl) {
      setNfts(prev => [...prev, {
        tokenId: tokenId.toString(),
        imageUrl: memeUrl
      }])

      // Move to next NFT or finish
      if (currentIndex + 1 < Number(balance)) {
        setCurrentIndex(currentIndex + 1)
      } else {
        setIsLoadingNFTs(false)
      }
    }
  }, [balance, isLoadingBalance, currentIndex, tokenId, memeUrl, isLoadingTokenId, isLoadingMemeUrl])

  // Show loading state
  if (isLoadingBalance || isLoadingNFTs) {
    return (
      <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white">Loading your NFTs...</p>
          {balance && (
            <p className="text-gray-400">Loading NFT {currentIndex + 1} of {balance.toString()}</p>
          )}
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="fixed inset-0 bg-[#1f1f1f] overflow-hidden">
      {/* Fixed Header */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-[#1f1f1f] p-4 border-b border-[#2f2f2f]">
        <h1 className="text-2xl font-bold text-white">Your Minted NFTs</h1>
      </header>

      {/* Scrollable Content */}
      <div className="absolute inset-0 mt-16 p-4 overflow-y-auto">
        {nfts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center space-y-4">
            <p className="text-gray-400">No NFTs found</p>
            <p className="text-sm text-gray-500">
              Start minting some memes to see them here!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {nfts.map((nft) => (
              <motion.div
                key={nft.tokenId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#2f2f2f] rounded-lg overflow-hidden"
              >
                <div className="aspect-square relative">
                  <img
                    src={nft.imageUrl}
                    alt={`NFT #${nft.tokenId}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-white font-medium">NFT #{nft.tokenId}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
