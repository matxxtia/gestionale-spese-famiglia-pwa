'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import ServiceWorkerRegistration from '../components/ServiceWorkerRegistration'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ServiceWorkerRegistration />
      {children}
    </SessionProvider>
  )
}