'use client'

import { useAccount } from 'wagmi'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { status } = useAccount()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'disconnected' && pathname !== '/login') {
      router.push('/login')
    }
  }, [status, router, pathname])

  if (status === 'connecting') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Connecting...</div>
      </div>
    )
  }

  return <>{children}</>
}
