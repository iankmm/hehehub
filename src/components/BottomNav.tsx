'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, MessageCircle, User } from 'lucide-react'

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Chat', path: '/chat', icon: MessageCircle },
    { name: 'Me', path: '/me', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-[#121212] border-t border-[#2f2f2f]">
      <div className="flex h-full items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path
          const Icon = item.icon

          return (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center w-16 h-full
                       ${isActive ? 'text-white' : 'text-[#898989]'}
                       transition-colors duration-200`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.name}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
