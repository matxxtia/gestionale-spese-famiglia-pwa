'use client'

import { useEffect, useState } from 'react'

export default function ServiceWorkerRegistration() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!hasMounted) return
    
    // Only register service worker in production or when explicitly enabled
    if (process.env.NODE_ENV === 'development') {
      console.log('Service Worker registration skipped in development')
      return
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          console.log('SW registered: ', registration)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            console.log('SW update found')
          })
        })
        .catch(function(registrationError) {
          console.log('SW registration failed: ', registrationError)
        })
    }
  }, [hasMounted])

  return null
}