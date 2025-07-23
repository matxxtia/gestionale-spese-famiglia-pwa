'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          console.log('SW registered: ', registration)
        })
        .catch(function(registrationError) {
          console.log('SW registration failed: ', registrationError)
        })
    }
  }, [])

  return null
}