'use client'

import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-[#121212] pb-20">
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-6"
        >
          <MessageCircle className="w-16 h-16 text-[#898989] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Chat Coming Soon
          </h1>
          <p className="text-[#898989]">
            Stay tuned! Chat functionality will be available soon.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
