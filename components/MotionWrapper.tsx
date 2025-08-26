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

// NEW: support more motion element types
const MotionForm = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.form),
  { ssr: false }
)

const MotionH2 = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.h2),
  { ssr: false }
)

const MotionP = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.p),
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
  onSubmit?: (e: any) => void
  type?: 'div' | 'button' | 'form' | 'h2' | 'p'
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
  onSubmit,
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
    onClick,
    onSubmit
  }

  // Provide a semantic fallback matching the type to reduce SSR/client diffs
  const Fallback = () => {
    switch (type) {
      case 'button':
        return <button className={className}>{children}</button>
      case 'form':
        return <form className={className}>{children}</form>
      case 'h2':
        return <h2 className={className}>{children}</h2>
      case 'p':
        return <p className={className}>{children}</p>
      default:
        return <div className={className}>{children}</div>
    }
  }

  return (
    <ClientOnly fallback={<Fallback />}> 
      {type === 'button' ? (
        <MotionButton {...motionProps}>
          {children}
        </MotionButton>
      ) : type === 'form' ? (
        <MotionForm {...motionProps}>
          {children}
        </MotionForm>
      ) : type === 'h2' ? (
        <MotionH2 {...motionProps}>
          {children}
        </MotionH2>
      ) : type === 'p' ? (
        <MotionP {...motionProps}>
          {children}
        </MotionP>
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