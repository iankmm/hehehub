'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useActiveAccount, useActiveWalletConnectionStatus } from "thirdweb/react"

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const activeAccount = useActiveAccount()
  const connectionStatus = useActiveWalletConnectionStatus()
  const router = useRouter()
  const pathname = usePathname()
  const isSignInPage = pathname === '/login'
  const [isInitialized, setIsInitialized] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Handle wallet initialization
  useEffect(() => {
    const initializeWallet = async () => {
      // Wait a bit longer to ensure thirdweb is fully initialized
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsInitialized(true)
    }

    initializeWallet()
  }, [])

  // Handle initial auth check and token validation
  useEffect(() => {
    let isMounted = true
    let checkInterval: NodeJS.Timeout | null = null

    const checkAuthState = async () => {
      if (!isMounted) return
      if (isAuthenticating) return
      if (!isInitialized) return

      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')

      console.log('Auth Check:', {
        isConnected: connectionStatus === 'connected',
        connectionStatus,
        hasToken: !!token,
        hasUser: !!user,
        path: pathname,
        isSignInPage,
        isInitialized,
        address: activeAccount?.address
      })
      
      // If wallet is still initializing or connecting, wait
      if (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') {
        return
      }

      // Handle non-login pages
      if (!isSignInPage) {
        if (connectionStatus !== 'connected' || !token || !user) {
          router.push('/login')
          return
        }

        // Validate token by checking wallet connection
        if (connectionStatus !== 'connected' || !activeAccount?.address) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }

        // Verify the stored user matches the connected wallet
        try {
          const storedUser = JSON.parse(user)
          if (storedUser.address.toLowerCase() !== activeAccount.address.toLowerCase()) {
            console.log('Stored user does not match connected wallet')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            router.push('/login')
            return
          }
        } catch (error) {
          console.error('Error parsing stored user:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }
      }
    }

    // Perform initial check
    checkAuthState()

    // Set up periodic checks
    checkInterval = setInterval(checkAuthState, 3000)

    return () => {
      isMounted = false
      if (checkInterval) {
        clearInterval(checkInterval)
      }
    }
  }, [isInitialized, pathname, router, connectionStatus, activeAccount?.address])

  // Show nothing while initializing to prevent flashing
  if (!isInitialized) {
    return null
  }

  // Render children once initialized
  return <>{children}</>
}
