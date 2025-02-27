'use client'

import { useAccount, useConnect } from 'wagmi'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { injected } from 'wagmi/connectors'

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { status, address, isConnected } = useAccount()
  const { connect } = useConnect()
  const router = useRouter()
  const pathname = usePathname()
  const isSignInPage = pathname === '/login'
  const [isInitialized, setIsInitialized] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Handle wallet initialization
  useEffect(() => {
    const initializeWallet = async () => {
      // Wait a bit longer to ensure wagmi is fully initialized
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // If we have a stored user but not connected, try to reconnect
      const user = localStorage.getItem('user')
      if (user && !isConnected && status !== 'connected') {
        try {
          await connect({ connector: injected() })
          // Add delay after connection
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error('Error reconnecting wallet:', error)
        }
      }
      
      setIsInitialized(true)
    }

    initializeWallet()
  }, [isConnected, status, connect])

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
        isConnected,
        status,
        hasToken: !!token,
        hasUser: !!user,
        path: pathname,
        isSignInPage,
        isInitialized,
        address
      })
      
      // If wallet is still initializing or connecting, wait
      if (status === 'connecting' || status === 'reconnecting') {
        return
      }

      // Handle non-login pages
      if (!isSignInPage) {
        // If we have stored credentials but wallet is not connected, try to reconnect
        if (token && user && !isConnected && status !== 'connected') {
          try {
            await connect({ connector: injected() })
            // Add delay after connection
            await new Promise(resolve => setTimeout(resolve, 500))
            return // Wait for next check after connection attempt
          } catch (error) {
            console.error('Error reconnecting wallet:', error)
          }
        }

        if (!isConnected || !token || !user) {
          router.push('/login')
          return
        }

        // Validate token by checking wallet connection
        if (!isConnected || !address) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }

        // Verify the stored user matches the connected wallet
        try {
          const storedUser = user ? JSON.parse(user) : null
          if (!storedUser || storedUser.address.toLowerCase() !== address.toLowerCase()) {
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
      // Handle login page
      else {
        if (isConnected && token && user) {
          try {
            const storedUser = JSON.parse(user)
            if (storedUser.address.toLowerCase() === address.toLowerCase()) {
              router.push('/')
              return
            }
          } catch (error) {
            console.error('Error parsing stored user:', error)
          }
        }
      }
    }

    // Run initial check
    checkAuthState()

    // Set up interval to periodically check auth state
    checkInterval = setInterval(checkAuthState, 2000)

    return () => {
      isMounted = false
      if (checkInterval) {
        clearInterval(checkInterval)
      }
    }
  }, [isConnected, status, address, pathname, isSignInPage, isInitialized, isAuthenticating, router, connect])

  if (!isInitialized) {
    return null
  }

  return <>{children}</>
}
