'use client'

import { useAccount } from 'wagmi'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { status } = useAccount()
  const router = useRouter()
  const pathname = usePathname()
  const isSignInPage = pathname === '/login'
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    // If we're not on the login page and there's no token, redirect to login
    if (!token && !isSignInPage) {
      router.push('/login')
      return
    }

    // If we're on the login page and have a valid token, redirect to home
    if (token && user && isSignInPage) {
      router.push('/')
      return
    }

    setIsInitialized(true)
  }, [isSignInPage, router])

  // Only check wallet connection status if we have a token
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && status === 'disconnected' && !isSignInPage) {
      // Clear token and redirect to login if wallet is disconnected
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
  }, [status, router, pathname, isSignInPage])

  // Show nothing until we've checked the token
  if (!isInitialized) {
    return null
  }

  return <>{children}</>
}
