'use client'

import { DollarSign } from 'lucide-react'
import MotionWrapper from './MotionWrapper'

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <MotionWrapper
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <MotionWrapper
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <DollarSign className="w-8 h-8 text-white" />
        </MotionWrapper>
        
        <MotionWrapper
          type="h2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-semibold text-gray-900 mb-2"
        >
          Loading...
        </MotionWrapper>
        
        <MotionWrapper
          type="p"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600"
        >
          Setting up your family expense manager
        </MotionWrapper>
      </MotionWrapper>
    </div>
  )
}