'use client'

import { useAccount } from 'wagmi'
import { readContract } from '@wagmi/core'
import { useEffect, useState } from 'react'
import { getConfig } from '@/lib/wagmi'
import { motion } from 'framer-motion'

// Import the ABI directly to ensure we have the latest version
const HeheMemeABI = [
  {
    "inputs": [{"internalType": "address","name": "owner","type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "owner","type": "address"},{"internalType": "uint256","name": "index","type": "uint256"}],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "tokenId","type": "uint256"}],
    "name": "getMemeUrl",
    "outputs": [{"internalType": "string","name": "","type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
]

interface NFT {
  tokenId: string
  imageUrl: string
}

export default function NFTsPage() {
  const { address, isConnected } = useAccount()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address) {
        setNfts([])
        setLoading(false)
        return
      }

      try {
        // Get user's NFT balance
        const balance = await readContract(getConfig(), {
          address: process.env.NEXT_PUBLIC_HEHEMEME_CONTRACT_ADDRESS as `0x${string}`,
          abi: HeheMemeABI,
          functionName: 'balanceOf',
          args: [address],
        }) as bigint

        console.log('NFT Balance:', balance.toString())

        // Fetch all NFTs owned by user
        const nftPromises = Array.from({ length: Number(balance) }, async (_, i) => {
          try {
            // Get tokenId at index
            const tokenId = await readContract(getConfig(), {
              address: process.env.NEXT_PUBLIC_HEHEMEME_CONTRACT_ADDRESS as `0x${string}`,
              abi: HeheMemeABI,
              functionName: 'tokenOfOwnerByIndex',
              args: [address, BigInt(i)],
            }) as bigint

            console.log('Token ID at index', i, ':', tokenId.toString())

            // Get meme URL for this token
            const memeUrl = await readContract(getConfig(), {
              address: process.env.NEXT_PUBLIC_HEHEMEME_CONTRACT_ADDRESS as `0x${string}`,
              abi: HeheMemeABI,
              functionName: 'getMemeUrl',
              args: [tokenId],
            }) as string

            console.log('Meme URL for token', tokenId.toString(), ':', memeUrl)

            return {
              tokenId: tokenId.toString(),
              imageUrl: memeUrl,
            }
          } catch (error) {
            console.error('Error fetching NFT at index', i, ':', error)
            return null
          }
        })

        const nftResults = (await Promise.all(nftPromises)).filter((nft): nft is NFT => nft !== null)
        console.log('Fetched NFTs:', nftResults)
        setNfts(nftResults)
      } catch (error) {
        console.error('Error fetching NFTs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [address])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#1f1f1f]">
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Your Wallet</h1>
        <p className="text-[#898989] text-center">
          Connect your wallet to view your minted NFTs
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 pb-20 bg-[#1f1f1f] text-white">
      <h1 className="text-2xl font-bold mb-6">Your Minted NFTs</h1>
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#898989]">No NFTs minted yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {nfts.map((nft) => (
            <motion.div
              key={nft.tokenId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-square rounded-xl overflow-hidden bg-[#2f2f2f]"
            >
              <img
                src={nft.imageUrl}
                alt={`NFT #${nft.tokenId}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1f1f1f]/80 to-transparent p-2">
                <p className="text-sm font-medium text-white">#{nft.tokenId}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
