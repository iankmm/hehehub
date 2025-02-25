import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useGesture } from 'react-use-gesture';

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
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showHehe, setShowHehe] = useState(false);
  const [showFakeHehe, setShowFakeHehe] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [imagesState, setImagesState] = useState<Image[]>(images);

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

  const handleLaugh = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/signin';
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
        // Update liked status
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
      } else if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/signin';
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
            setCurrentIndex(i => i - 1);
          } else if (dy < 0 && currentIndex < imagesState.length - 1) {
            setCurrentIndex(i => i + 1);
          }
        }
      }
    },
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

  if (!mounted) return null;

  const currentImage = imagesState[currentIndex];

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

              {/* Like Button */}
              <div className="absolute bottom-4 right-4 z-10">
                <button
                  onClick={handleLaugh}
                  className={`bg-white/10 backdrop-blur-sm p-3 rounded-full transition-all ${
                    likedPosts.has(currentImage.id) ? 'text-pink-500' : 'text-white'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill={likedPosts.has(currentImage.id) ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>

              {/* Side Actions */}
              <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
                <button 
                  className="text-white flex flex-col items-center"
                  onClick={handleLaugh}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
                              ${likedPosts.has(currentImage.id) 
                                ? 'bg-blue-500 hover:bg-blue-600' 
                                : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4-8c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm-8 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm4 5.12c2.33 0 4.29-1.46 5.05-3.5H6.95c.76 2.04 2.72 3.5 5.05 3.5z"/>
                    </svg>
                  </div>
                  <span className="text-sm mt-1">{currentImage.likes}</span>
                </button>

                <button 
                  className="text-white flex flex-col items-center"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                    </svg>
                  </div>
                  <span className="text-sm mt-1">Share</span>
                </button>
              </div>
            </div>
          </motion.div>
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
      </div>
    </div>
  );
}
