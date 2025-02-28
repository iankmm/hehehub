'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, MessageCircle, User, Plus } from 'lucide-react'
import { useState } from 'react'
import CreatePost from './CreatePost'

export default function BottomNav() {
  const pathname = usePathname()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)

  const isActive = (path: string) => pathname === path

  const handleDiscoverClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowComingSoon(true)
    setTimeout(() => setShowComingSoon(false), 2000)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1f1f1f] border-t border-[#2f2f2f] z-50">
      <nav className="max-w-lg mx-auto px-4">
        <ul className="flex items-center justify-between h-16">
          <li className="flex-1">
            <Link 
              href="/"
              className={`flex flex-col items-center justify-center h-full ${
                isActive('/') ? 'text-white' : 'text-[#898989]'
              }`}
            >
              <Home size={24} />
              <span className="text-xs mt-1">Home</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link
              href="/rankings"
              className={`flex flex-col items-center justify-center h-full ${
                isActive('/rankings') ? 'text-pink-500' : 'text-[#898989] hover:text-white'
              }`}
            >
              <Trophy size={24} />
              <span className="text-xs mt-1">Rankings</span>
            </Link>
          </li>
          <li className="flex-1 -mt-8">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex flex-col items-center justify-center w-14 h-14 mx-auto bg-pink-500 rounded-full text-white shadow-lg transform transition-transform hover:scale-105"
            >
              <Plus size={28} />
            </button>
          </li>
          <li className="flex-1">
            <Link
              href="/chat"
              className={`flex flex-col items-center justify-center h-full ${
                isActive('/chat') ? 'text-white' : 'text-[#898989]'
              }`}
            >
              <MessageCircle size={24} />
              <span className="text-xs mt-1">Chat</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link
              href="/me"
              className={`flex flex-col items-center justify-center h-full ${
                isActive('/me') ? 'text-white' : 'text-[#898989]'
              }`}
            >
              <User size={24} />
              <span className="text-xs mt-1">Me</span>
            </Link>
          </li>
        </ul>
      </nav>

      <CreatePost isOpen={isCreateOpen} setIsOpen={setIsCreateOpen} />
    </div>
  )
}
