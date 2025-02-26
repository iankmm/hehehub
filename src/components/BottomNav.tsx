'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, MessageCircle, User, Plus, Image } from 'lucide-react'
import { useState } from 'react'
import CreatePost from './CreatePost'

export default function BottomNav() {
  const pathname = usePathname()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)

  const handleDiscoverClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowComingSoon(true)
    setTimeout(() => setShowComingSoon(false), 2000)
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1f1f1f] border-t border-[#2f2f2f] z-40">
        <div className="flex items-center h-16 mx-auto relative max-w-lg">
          {/* Left Section */}
          <div className="flex-1 flex justify-start space-x-8 pl-6">
            <Link
              href="/"
              className={`flex flex-col items-center justify-center 
                       ${pathname === '/' ? 'text-white' : 'text-[#898989]'}`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs mt-1">Home</span>
            </Link>

            <Link
              href="/nfts"
              className={`flex flex-col items-center justify-center 
                       ${pathname === '/nfts' ? 'text-white' : 'text-[#898989]'}`}
            >
              <Image className="w-6 h-6" />
              <span className="text-xs mt-1">NFTs</span>
            </Link>

            <button
              onClick={handleDiscoverClick}
              className="flex flex-col items-center justify-center text-[#898989] relative"
            >
              <Search className="w-6 h-6" />
              {showComingSoon && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#2f2f2f] text-white 
                            px-3 py-1 rounded-full text-xs whitespace-nowrap
                            animate-fade-in-out">
                  Coming Soon
                </div>
              )}
              <span className="text-xs mt-1">Discover</span>
            </button>
          </div>

          {/* Center Plus Button */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-5">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center
                       hover:bg-pink-600 transition-colors shadow-lg
                       border-4 border-[#1f1f1f]"
            >
              <Plus className="w-8 h-8 text-white" />
            </button>
          </div>

          {/* Right Section */}
          <div className="flex-1 flex justify-end space-x-12 pr-6">
            <Link
              href="/chat"
              className={`flex flex-col items-center justify-center
                       ${pathname === '/chat' ? 'text-white' : 'text-[#898989]'}`}
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs mt-1">Chat</span>
            </Link>

            <Link
              href="/me"
              className={`flex flex-col items-center justify-center
                       ${pathname === '/me' ? 'text-white' : 'text-[#898989]'}`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs mt-1">Me</span>
            </Link>
          </div>
        </div>
      </nav>

      <CreatePost isOpen={isCreateOpen} setIsOpen={setIsCreateOpen} />
    </>
  )
}
