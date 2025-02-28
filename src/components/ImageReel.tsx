import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useGesture } from 'react-use-gesture';
import { Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createThirdwebClient, getContract, sendTransaction, prepareContractCall, waitForReceipt } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { useActiveAccount, useActiveWalletConnectionStatus, useReadContract } from "thirdweb/react";
import HeheMemeABI from '@/contracts/HeheMeme.json';
import { Check } from 'lucide-react';

const client = createThirdwebClient({
  clientId: "8e1035b064454b1b9505e0dd626a8555"
});

const contract = getContract({
  client,
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
  chain: baseSepolia,
});

interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  username: string;
  heheScore: number;
  hasLiked: boolean;
  createdAt: string;
  user?: {
    username: string;
    heheScore: number;
  }
}

interface ImageReelProps {
  images: Post[];
  onEndReached: () => void;
}

export default function ImageReel({ images, onEndReached }: ImageReelProps) {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const connectionStatus = useActiveWalletConnectionStatus();
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showHehe, setShowHehe] = useState(false);
  const [showFakeHehe, setShowFakeHehe] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [isMinting, setIsMinting] = useState(false);
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  const [showMintSuccess, setShowMintSuccess] = useState(false);
  const [isWalletReady, setIsWalletReady] = useState(false);
  const [direction, setDirection] = useState(0);
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);

  // Get current image directly from props
  const currentImage = images[currentIndex];

  // Format current image if it has nested user data
  const formattedCurrentImage = currentImage ? {
    ...currentImage,
    username: currentImage.user?.username || currentImage.username,
    heheScore: currentImage.user?.heheScore || currentImage.heheScore
  } : null;

  // Initialize liked posts from props
  useEffect(() => {
    const initialLikedPosts = new Set(
      images.filter(img => img.hasLiked).map(img => img.id)
    );
    setLikedPosts(initialLikedPosts);
  }, [images]);

  // Reset index when first image changes
  useEffect(() => {
    if (images[0]?.id !== currentImage?.id) {
      setCurrentIndex(0);
    }
  }, [images[0]?.id]);

  // Handle wallet initialization
  useEffect(() => {
    const initializeWallet = async () => {
      // Wait for wallet to be fully initialized
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMounted(true);
      setIsWalletReady(true);
    };

    initializeWallet();
  }, []);

  // Monitor wallet connection status
  useEffect(() => {
    if (!mounted) return;
    
    console.log('Wallet status:', {
      isConnected: connectionStatus === 'connected',
      connectionStatus,
      address: activeAccount?.address,
      isWalletReady
    });

    // Reset wallet ready state if disconnected
    if (connectionStatus !== 'connected') {
      setIsWalletReady(false);
    }
  }, [connectionStatus, activeAccount?.address, mounted]);

  const handleMint = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Mint clicked:', { 
      connectionStatus, 
      address: activeAccount?.address,
      isWalletReady,
      mounted 
    });

    if (!isWalletReady || connectionStatus !== 'connected' || !activeAccount?.address) {
      setShowConnectPrompt(true);
      setTimeout(() => setShowConnectPrompt(false), 3000);
      return;
    }

    if (isMinting) return;

    setIsMinting(true);

    try {
      const transaction = await prepareContractCall({
        contract,
        method: "function mintMeme(string memory _tokenURI)",
        params: [currentImage.imageUrl],
      });

      const { transactionHash } = await sendTransaction({
        account: activeAccount,
        transaction,
      });

      const receipt = await waitForReceipt({
        client,
        chain: baseSepolia,
        transactionHash,
      });
      console.log(receipt)
      // Check if transaction was successful
      if (receipt.status === 'success') {
        setShowMintSuccess(true);
        // Keep the success message visible for longer (5 seconds)
        await new Promise(resolve => setTimeout(resolve, 5000));
        setShowMintSuccess(false);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error minting:', error);
    } finally {
      setIsMinting(false);
    }
  };

  const handleLaugh = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const currentImage = images[currentIndex];
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

        // Update current image likes count
        currentImage.likes = isLiked ? currentImage.likes - 1 : currentImage.likes + 1;
        currentImage.hasLiked = !isLiked;

      } else if (res.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const bind = useGesture({
    onDrag: ({ movement: [mx, my], velocity, direction: [dx, dy], distance, last }) => {
      setIsDragging(true);
      
      if (last) {
        setIsDragging(false);
        const swipeThreshold = velocity > 0.3 || distance > 50;
        
        if (swipeThreshold) {
          if (dy > 0 && currentIndex > 0) {
            setDirection(-1);
            setCurrentIndex(i => i - 1);
          } else if (dy < 0 && currentIndex < images.length - 1) {
            setDirection(1)
            setCurrentIndex(i => i + 1);
          }
        }
      }
    },
    onWheel: ({ movement: [mx, my], velocity }) => {
      if (Math.abs(velocity) > 0.1) {
        if (my > 0 && currentIndex > 0) {
          setDirection(-1)
          setCurrentIndex(i => i - 1);
        } else if (my < 0 && currentIndex < images.length - 1) {
          setDirection(1)
          setCurrentIndex(i => i + 1);
        }
      }
    }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if we're near the end and should load more
    if (currentIndex >= images.length - 2) {
      onEndReached();
    }
    console.log("Meme has been changed!!!!!!!!!");
  }, [currentIndex, images.length, onEndReached]);

  if (!mounted) return null;

  const variants = {
    enter: (dir: number) => ({
      y: dir > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      y: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      y: dir > 0 ? -1000 : 1000,
      opacity: 0
    })
  };

  return (
    <div className="fixed inset-0 bg-black">
      <div 
        className="h-full w-full relative touch-none flex items-center justify-center"
        {...bind()}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              y: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
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
                  className="bg-pink-500 text-white rounded-full p-3 
                           hover:bg-pink-600 transition-all duration-200 
                           flex items-center justify-center
                           relative group"
                  title={connectionStatus === 'connected' ? 'Mint as NFT' : 'Connect wallet to mint'}
                >
                  {isMinting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded
                                opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {connectionStatus === 'connected' ? 'Mint as NFT' : 'Connect wallet to mint'}
                  </div>
                </button>

                {/* Like Button */}
                <button
                  onClick={handleLaugh}
                  className={`rounded-full p-3 transition-all duration-200 flex items-center space-x-2 ${
                    likedPosts.has(currentImage.id)
                      ? 'bg-pink-500 text-white'
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
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
                  >
                    <div className="bg-[#2f2f2f] rounded-2xl p-8 shadow-xl max-w-sm w-full mx-4">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center">
                          <Check className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Successfully minted!</h3>
                        <p className="text-gray-400">Your meme has been minted as an NFT. View it in your profile.</p>
                        <button
                          onClick={() => setShowMintSuccess(false)}
                          className="mt-6 w-full bg-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-pink-600 transition-colors"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress Bar */}
              <div className="absolute top-2 left-0 right-0 px-4 z-50">
                <div className="w-full bg-white/30 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / images.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Navigation Hints */}
              {currentIndex < images.length - 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm animate-bounce">
                  Swipe up for next
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
