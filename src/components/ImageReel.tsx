import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useGesture } from 'react-use-gesture';
import { Image as ImageIcon } from 'lucide-react';
import { useWriteContract, useAccount } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { getConfig } from '@/lib/wagmi';
import HeheMemeABI from '@/contracts/HeheMeme.json';
//import { useRouter } from 'next/navigation';
//import { baseSepolia } from 'viem/chains';

interface Image {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  username: string;
  heheScore: number;
  hasLiked: boolean;
}

interface ImageReelProps {
  images: Image[];
  onEndReached: () => void;
}

export default function ImageReel({ images, onEndReached }: ImageReelProps) {
  //const router = useRouter();
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showHehe, setShowHehe] = useState(false);
  const [showFakeHehe, setShowFakeHehe] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [imagesState, setImagesState] = useState<Image[]>(images);
  const [isMinting, setIsMinting] = useState(false);
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  const [showMintSuccess, setShowMintSuccess] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<string>();

  const currentImage = imagesState[currentIndex];

  useEffect(() => {
    console.log('Contract Address:', process.env.NEXT_PUBLIC_HEHEMEME_CONTRACT_ADDRESS);
    console.log('Current Image URL:', currentImage?.imageUrl);
  }, [currentImage]);

  // Contract interaction hooks
  const { writeContract, data: mintData, error: mintError } = useWriteContract();

  useEffect(() => {
    if (mintError) {
      console.error('Mint error:', mintError);
      setIsMinting(false);
    }
  }, [mintError]);

  useEffect(() => {
    const waitForMint = async () => {
      if (!mintData) return;
      console.log('mintData', mintData) 
      // try {
        const receipt = await waitForTransactionReceipt(getConfig(), {
          hash: mintData,
          confirmations: 1
        });
        
        // Find the MemeMinted event
        const mintEvent = receipt.logs.find(log => {
          try {
            const event = decodeEventLog({
              abi: HeheMemeABI.abi,
              data: log.data,
              topics: log.topics,
            });
            return event.eventName === 'MemeMinted';
          } catch {
            return false;
          }
        });

        if (mintEvent) {
          const { tokenId } = mintEvent.args;
          setMintedTokenId(tokenId.toString());
        }

        setShowMintSuccess(true);
        setTimeout(() => {
          setShowMintSuccess(false);
          setMintedTokenId(undefined);
        }, 3000);
      // } catch (error) {
      //   console.error('Error waiting for transaction:', error);
      // } finally {
        setIsMinting(false);
      // }
    };

    waitForMint();
  }, [mintData]);

  const handleMint = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isConnected) {
      setShowConnectPrompt(true);
      setTimeout(() => setShowConnectPrompt(false), 3000);
      return;
    }

    if (!currentImage?.imageUrl) {
      console.error('No image URL available');
      return;
    }

    if (isMinting) return;

    setIsMinting(true);
    try {
      await writeContract({
        address: process.env.NEXT_PUBLIC_HEHEMEME_CONTRACT_ADDRESS as `0x${string}`,
        abi: HeheMemeABI.abi,
        functionName: 'mintMeme',
        args: [currentImage.imageUrl],
      });
    } catch (error) {
      console.error('Error minting:', error);
      setIsMinting(false);
    }
  };

  const handleLaugh = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const currentImage = imagesState[currentIndex];
    const isLiked = likedPosts.has(currentImage.id);
    const method = isLiked ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`/api/posts/${currentImage.id}/like`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Update liked status locally
        const newLikedPosts = new Set(likedPosts);
        if (isLiked) {
          newLikedPosts.delete(currentImage.id);
          setShowFakeHehe(true);
          setTimeout(() => setShowFakeHehe(false), 1500);
        } else {
          newLikedPosts.add(currentImage.id);
          setShowHehe(true);
          setTimeout(() => setShowHehe(false), 1500);
        }
        setLikedPosts(newLikedPosts);

        // Update likes count in the current image
        const updatedImages = [...imagesState];
        updatedImages[currentIndex] = {
          ...currentImage,
          likes: isLiked ? currentImage.likes - 1 : currentImage.likes + 1,
          hasLiked: !isLiked
        };
        setImagesState(updatedImages);

        // Refresh the posts data to get updated counts
        const updatedRes = await fetch(`/api/posts?page=1&limit=${imagesState.length}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          setImagesState(data.posts);
        }
      } else if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const bind = useGesture({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onDrag: ({ movement: [mx, my], velocity, direction: [dx, dy], distance, last }) => {
      setIsDragging(true);
      
      if (last) {
        setIsDragging(false);
        const swipeThreshold = velocity > 0.3 || distance > 50;
        
        if (swipeThreshold) {
          if (dy > 0 && currentIndex > 0) {
            setCurrentIndex(i => i - 1);
          } else if (dy < 0 && currentIndex < imagesState.length - 1) {
            setCurrentIndex(i => i + 1);
          }
        }
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onWheel: ({ movement: [mx, my], velocity }) => {
      if (Math.abs(velocity) > 0.1) {
        if (my > 0 && currentIndex > 0) {
          setCurrentIndex(i => i - 1);
        } else if (my < 0 && currentIndex < imagesState.length - 1) {
          setCurrentIndex(i => i + 1);
        }
      }
    }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setImagesState(images);
    // Initialize likedPosts with posts that the user has already liked
    const initialLikedPosts = new Set(
      images.filter(img => img.hasLiked).map(img => img.id)
    );
    setLikedPosts(initialLikedPosts);
  }, [images]);

  useEffect(() => {
    // Check if we're near the end and should load more
    if (currentIndex >= imagesState.length - 2) {
      onEndReached();
    }
  }, [currentIndex, imagesState.length, onEndReached]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-black">
      <div 
        className="h-full w-full relative touch-none flex items-center justify-center"
        {...bind()}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ y: isDragging ? 0 : 1000, opacity: isDragging ? 1 : 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -1000, opacity: 0 }}
            transition={{
              y: { type: "spring", stiffness: 300, damping: isDragging ? 40 : 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute w-full h-full flex items-center justify-center"
          >
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {/* Image Container */}
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={currentImage.imageUrl}
                  alt={currentImage.caption}
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                  draggable="false"
                  style={{
                    maxHeight: 'calc(100vh - 120px)', // Account for top and bottom bars
                    width: 'auto'
                  }}
                />
              </div>
              
              {/* HEHE Animation */}
              <AnimatePresence>
                {showHehe && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center z-50"
                  >
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4">
                      <span className="text-4xl font-bold text-white">HEHE complete! 🤣</span>
                    </div>
                  </motion.div>
                )}
                {showFakeHehe && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center z-50"
                  >
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4">
                      <span className="text-4xl font-bold text-white">Fake hehe detected 😢</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Overlay Content */}
              <div className="absolute bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="text-white mb-4">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-lg">@{currentImage.username}</p>
                  </div>
                  <p className="text-sm mt-1">{currentImage.caption}</p>
                </div>
              </div>

              {/* Side Actions */}
              <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
                {/* Mint NFT Button */}
                <button
                  onClick={handleMint}
                  disabled={isMinting}
                  className="bg-gradient-to-r from-purple-400 to-pink-600 text-white rounded-full p-3 
                           hover:from-purple-500 hover:to-pink-700 transition-all duration-200 
                           flex items-center justify-center
                           relative group"
                  title={isConnected ? 'Mint as NFT' : 'Connect wallet to mint'}
                >
                  {isMinting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded
                                opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {isConnected ? 'Mint as NFT' : 'Connect wallet to mint'}
                  </div>
                </button>

                {/* Like Button */}
                <button
                  onClick={handleLaugh}
                  className={`rounded-full p-3 transition-all duration-200 flex items-center space-x-2 ${
                    likedPosts.has(currentImage.id)
                      ? 'bg-pink-600 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <span className="text-xl">🤣</span>
                  <span className="font-medium">{currentImage.likes}</span>
                </button>

                {/* Connect Prompt */}
                <AnimatePresence>
                  {showConnectPrompt && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs py-1 px-2 rounded"
                    >
                      Please connect wallet first
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mint Success Animation */}
              <AnimatePresence>
                {showMintSuccess && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                  >
                    <div className="bg-black/80 backdrop-blur-sm rounded-xl p-8 text-center">
                      <h3 className="text-3xl font-bold text-white mb-2">NFT Minted! 🎨</h3>
                      {mintedTokenId && (
                        <p className="text-gray-300">Token ID: #{mintedTokenId}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress Bar */}
              <div className="absolute top-2 left-0 right-0 px-4 z-50">
                <div className="w-full bg-white/30 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / imagesState.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Navigation Hints */}
              {currentIndex < imagesState.length - 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm animate-bounce">
                  Swipe up for next
                </div>
              )}

              {/* Debug Info */}
              {/* {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-4 left-4 bg-black/50 p-2 rounded text-xs text-white">
                  <div>Contract: {process.env.NEXT_PUBLIC_HEHEMEME_CONTRACT_ADDRESS}</div>
                  <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
                  <div>Image URL: {currentImage?.imageUrl?.slice(0, 20)}...</div>
                  <div>Is Minting: {isMinting ? 'Yes' : 'No'}</div>
                  <div>Transaction Hash: {mintData}</div>
                  <div>Error: {mintError ? String(mintError) : 'None'}</div>
                  <div>Minted Token ID: {mintedTokenId || 'None'}</div>
                </div>
              )} */}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
