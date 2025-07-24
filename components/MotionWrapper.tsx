'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'
import ClientOnly from './ClientOnly'

// Dynamically import motion components to prevent SSR issues
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: false }
)

const MotionButton = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.button),
  { ssr: false }
)

interface MotionWrapperProps {
  children: ReactNode
  className?: string
  initial?: any
  animate?: any
  exit?: any
  transition?: any
  whileHover?: any
  whileTap?: any
  onClick?: () => void
  type?: 'div' | 'button'
}

/**
 * Wrapper for framer-motion components to prevent hydration issues
 */
export default function MotionWrapper({
  children,
  className,
  initial,
  animate,
  exit,
  transition,
  whileHover,
  whileTap,
  onClick,
  type = 'div'
}: MotionWrapperProps) {
  const motionProps = {
    className,
    initial,
    animate,
    exit,
    transition,
    whileHover,
    whileTap,
    onClick
  }

  return (
    <ClientOnly fallback={<div className={className}>{children}</div>}>
      {type === 'button' ? (
        <MotionButton {...motionProps}>
          {children}
        </MotionButton>
      ) : (
        <MotionDiv {...motionProps}>
          {children}
        </MotionDiv>
      )}
    </ClientOnly>
  )
}

// Export AnimatePresence wrapper
export const AnimatePresenceWrapper = dynamic(
  () => import('framer-motion').then((mod) => mod.AnimatePresence),
  { ssr: false }
)