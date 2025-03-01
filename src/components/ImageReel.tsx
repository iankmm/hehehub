"use client"; // Make sure this runs on the client side
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useGesture } from 'react-use-gesture';
import { Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createThirdwebClient, getContract, sendTransaction, prepareContractCall, waitForReceipt, prepareTransaction,toWei } from "thirdweb";
// import { baseSepolia } from "thirdweb/chains";
import { selectedChain } from "@/lib/chains";
import { useActiveAccount, useActiveWalletConnectionStatus } from "thirdweb/react";
import HeheMemeABI from '@/contracts/HeheMeme.json';
import { Check } from 'lucide-react';

const client = createThirdwebClient({
  clientId: "8e1035b064454b1b9505e0dd626a8555"
});

const contract = getContract({
  client,
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
  chain: selectedChain,
});

const contract2 = getContract({
  client,
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PRIZE || "",
  chain: selectedChain,
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
  const [showMintConfirmation, setShowMintConfirmation] = useState(false);

  // === ADDED for face detection ===
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerComplete, setIsTimerComplete] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [smileDetected, setSmileDetected] = useState(false);

  // The current image
  const currentImage = images[currentIndex];
  const formattedCurrentImage = currentImage ? {
    ...currentImage,
    username: currentImage.user?.username || currentImage.username,
    heheScore: currentImage.user?.heheScore || currentImage.heheScore
  } : null;

  // Initialize liked posts
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

    if (connectionStatus !== 'connected') {
      setIsWalletReady(false);
    }
  }, [connectionStatus, activeAccount?.address, mounted]);

  // === ADDED for face detection: Load models once ===
  useEffect(() => {
    async function loadModels() {
      try {
        const faceapi = (window as any).faceapi;
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading face-api models:', error);
      }
    }
    loadModels();
  }, []);

  // === ADDED for face detection: Start camera ===
  useEffect(() => {
    if (!modelsLoaded) return;

    let localStream: MediaStream;
    async function startVideo() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          await videoRef.current.play();
        }
        setCameraReady(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    }

    startVideo();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [modelsLoaded]);

  // === Modify timer effect to only run for unliked posts ===
  useEffect(() => {
    let interval: NodeJS.Timeout;

    setTimeElapsed(0);
    setIsTimerComplete(false);
    setSmileDetected(false);

    // Check if post is already liked
    if (likedPosts.has(currentImage.id)) {
      setSmileDetected(true);
      setTimeElapsed(REACTION_TIMER_SECONDS);
      setIsTimerComplete(true);
      return;
    }

    if (cameraReady && modelsLoaded) {
      interval = setInterval(async () => {
        setTimeElapsed(prev => {
          const newTime = prev + 1;

          if (videoRef.current) {
            detectSmile(videoRef.current).then((isSmiling) => {
              if (isSmiling) {
                console.log('User is smiling or laughing! Timer complete.');
                setSmileDetected(true);
                setTimeElapsed(REACTION_TIMER_SECONDS); // Set to full
                setIsTimerComplete(true);
                handleLaugh();
                clearInterval(interval);
              }
            });
          }

          if (newTime >= 5) {
            setIsTimerComplete(true);
            clearInterval(interval);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
      setTimeElapsed(0);
      setSmileDetected(false);
    };
  }, [currentIndex, cameraReady, modelsLoaded]);

  // === ADDED for face detection: The function to detect smiles ===
  async function detectSmile(videoEl: HTMLVideoElement) {
    try {
      const faceapi = (window as any).faceapi;
      const detections = await faceapi
        .detectAllFaces(
          videoEl,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.2 })
        )
        .withFaceExpressions();
  
      console.log('detections:', detections);
  
      if (detections && detections.length > 0) {
        const detection = detections[0];
        const { happy } = detection.expressions;
        console.log('happy score:', happy);
        if (happy > 0.7) {
          return true;
        }
      } else {
        console.log('No face detected');
      }
    } catch (err) {
      console.error('Error detecting smile:', err);
    }
    return false;
  }

  // Mint
  const handleMint = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!likedPosts.has(currentImage.id)) {
      console.log("User can only mint if they have liked the post")
      return;
    }

    // Add like threshold check
    if (currentImage.likes >= 7) {
      console.log("Cannot mint NFT - post has too many likes")
      return;
    }

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
      let transaction = await prepareContractCall({
        contract,
        method: "function mintMeme(string memory _tokenURI)",
        params: [currentImage.imageUrl],
      });

      let { transactionHash } = await sendTransaction({
        account: activeAccount,
        transaction,
      });

     
      let receipt = await waitForReceipt({
        client,
        chain: selectedChain,
        transactionHash,
      });
      // let receipt2 = await waitForReceipt({
      //   client,
      //   chain: baseSepolia,
      //   transactionHash: transactionHash2,
      // })
      // console.log(receipt2)
      // console.log(receipt2)
      if (receipt.status === 'success') {
        setShowMintConfirmation(true);
        setTimeout(() => {
          setShowMintConfirmation(false);
        }, 3000);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error minting:', error);
    } finally {
      setIsMinting(false);
    }

    let transaction2 = await prepareTransaction({
      to: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PRIZE || "",
      chain: selectedChain,
      client,
      // method: "",
      value: toWei("0.001") || 0
    });

      let { transactionHash: transactionHash2 } = await sendTransaction({
        account: activeAccount,
        transaction: transaction2,
      });
  };

  // Like
  const handleLaugh = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const currentImage = images[currentIndex];
    if (likedPosts.has(currentImage.id)) {
      return;
    }

    try {
      // Capture the reaction image
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(videoRef.current, 0, 0);
        
        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => 
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8)
        );

        // Create form data
        const formData = new FormData();
        formData.append('image', blob, 'reaction.jpg');
        formData.append('postId', currentImage.id);

        // Upload reaction
        const reactionRes = await fetch('/api/upload/reaction', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!reactionRes.ok) {
          console.error('Failed to upload reaction');
        }

        const { url: reactionUrl } = await reactionRes.json();

        console.log("reactionUrl", reactionUrl)

        // Like the post with reaction URL
        const res = await fetch(`/api/posts/${currentImage.id}/like`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reactionUrl })
        });

        if (res.ok) {
          const newLikedPosts = new Set(likedPosts);
          newLikedPosts.add(currentImage.id);
          setLikedPosts(newLikedPosts);
          setShowHehe(true);
          setTimeout(() => setShowHehe(false), 1500);

          currentImage.likes += 1;
          currentImage.hasLiked = true;
        } else if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  // Gesture
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
    if (currentIndex >= images.length - 2) {
      onEndReached();
    }
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

  const REACTION_TIMER_SECONDS = 5; // 5-second timer

  // First, create a helper function to determine if minting is allowed
  const canMint = (post: Post) => {
    return likedPosts.has(post.id) && post.likes < 7;
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
                    maxHeight: 'calc(100vh - 120px)',
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
                <button
                  onClick={handleMint}
                  disabled={!canMint(currentImage) || isMinting}
                  className={`bg-pink-500 text-white rounded-full p-3 
                              hover:bg-pink-600 transition-all duration-200 
                              flex items-center justify-center
                              relative group
                              ${!canMint(currentImage) ? 'cursor-not-allowed opacity-50' : ''}`}
                  title={connectionStatus === 'connected' ? 'Mint as NFT' : 'Connect wallet to mint'}
                >
                  {isMinting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : canMint(currentImage) ? (
                    <ImageIcon className="w-5 h-5" />
                  ) : (
                    <div className="flex items-center space-x-2 opacity-50 ">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded
                                opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {connectionStatus === 'connected' ? 'Mint as NFT' : 'Connect wallet to mint'}
                  </div>
                </button>

                <div
                  className={`rounded-full p-3 transition-all duration-200 flex items-center space-x-2 ${
                    likedPosts.has(currentImage.id)
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <span className="text-xl">🤣</span>
                  <span className="font-medium">{currentImage.likes}</span>
                </div>

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

              <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-gray-800">
                <div
                  className={`h-full transition-all duration-200 ease-linear ${
                    smileDetected
                      ? 'bg-green-500'
                      : isTimerComplete
                        ? 'bg-red-500'
                        : 'bg-white'
                  }`}
                  style={{ width: `${(timeElapsed / REACTION_TIMER_SECONDS) * 100}%` }}
                />
              </div>

              {currentIndex < images.length - 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm animate-bounce">
                  Swipe up for next
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hidden video element for face detection */}
      <video
        ref={videoRef}
        className="hidden"
        width="640"
        height="480"
        muted
        playsInline
      />

      {showMintConfirmation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl flex items-center space-x-2">
            <Check className="w-5 h-5" />
            <p className="text-lg font-medium">Successfully minted NFT!</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}