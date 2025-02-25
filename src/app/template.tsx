'use client'

import { usePathname } from 'next/navigation'

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  return (
    <>
      {children}
      {/* Hide bottom nav on auth pages */}
      <style jsx global>{`
        nav {
          display: ${isAuthPage ? 'none' : 'block'};
        }
      `}</style>
    </>
  )
}
