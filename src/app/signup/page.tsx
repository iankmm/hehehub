'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Laugh } from 'lucide-react'
import { useActiveAccount } from "thirdweb/react"

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const activeAccount = useActiveAccount()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, address: activeAccount?.address }),
      })

      const data = await res.json()

      if (res.ok) {
        // Store user data and token
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push('/')
      } else {
        setError(data.message || 'Something went wrong')
      }
    } catch (err) {
      setError('Failed to create account')
      console.error('Signup error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1f1f1f] p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-[#2f2f2f] p-4 rounded-full">
            <Laugh className="w-12 h-12 text-blue-400" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Create Your Account</h1>
            <p className="mt-2 text-[#898989]">Choose a username to start sharing memes</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#2f2f2f] rounded-lg p-6 space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#898989] mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#3f3f3f] rounded-lg 
                       text-white placeholder-[#898989] focus:outline-none focus:ring-2 
                       focus:ring-blue-400 focus:border-transparent"
              required
              minLength={3}
              maxLength={20}
              pattern="^[a-zA-Z0-9_]+$"
              title="Username can only contain letters, numbers, and underscores"
            />
            <p className="mt-2 text-xs text-[#898989]">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1f1f1f] text-white py-3 px-4 rounded-lg
                     border border-[#3f3f3f] hover:bg-[#2a2a2a] transition-colors
                     flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
