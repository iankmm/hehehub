'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Image as ImageIcon, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CreatePostProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onPostCreated?: (post: {
    id: string
    imageUrl: string
    caption: string
    likes: number
    username: string
    heheScore: number
    hasLiked: boolean
    createdAt: string
  }) => void
}

export default function CreatePost({ isOpen, setIsOpen, onPostCreated }: CreatePostProps) {
  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please login to post')
        return
      }

      if (!selectedFile) {
        setError('Please select an image')
        return
      }

      // First upload the image
      const formData = new FormData()
      formData.append('file', selectedFile)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      })

      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Failed to upload image')
      }

      // Then create the post
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUrl: uploadData.url,
          caption,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create post')
      }

      // Show success animation
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setIsOpen(false)
        router.push('/me')
      }, 1500)

      // Reset form
      setSelectedFile(null)
      setPreviewUrl(null)
      setCaption('')

      // Add new post to feed
      if (onPostCreated) {
        onPostCreated(data)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false)
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1f1f1f] rounded-xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2f2f2f]">
                <h2 className="text-xl font-semibold text-white">Create Post</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#898989] hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Success Animation */}
              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
                  >
                    <div className="bg-green-500 text-white px-6 py-4 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-6 h-6" />
                      <span className="text-lg font-medium">Post created!</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#898989] mb-2">
                    Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-full h-48 bg-[#2f2f2f] rounded-lg border-2 
                             border-dashed border-[#3f3f3f] hover:border-blue-500 
                             transition-colors cursor-pointer overflow-hidden"
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-[#898989]">
                        <ImageIcon className="w-8 h-8 mb-2" />
                        <span>Click to upload image</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Caption Input */}
                <div>
                  <label className="block text-sm font-medium text-[#898989] mb-2">
                    Caption
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption..."
                    required
                    rows={3}
                    className="w-full px-4 py-3 bg-[#2f2f2f] text-white rounded-lg 
                             border border-[#3f3f3f] focus:border-blue-500 
                             focus:outline-none placeholder-[#898989] resize-none"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !selectedFile}
                  className="w-full px-4 py-3 bg-pink-500 text-white rounded-lg
                           hover:bg-pink-600 transition-colors disabled:opacity-50
                           disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Posting...' : 'Post Meme'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
