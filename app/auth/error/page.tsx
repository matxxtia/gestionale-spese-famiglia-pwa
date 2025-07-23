'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: { [key: string]: string } = {
    CredentialsSignin: 'Invalid username or password. Please try again.',
    default: 'An unexpected error occurred. Please try again.',
  }

  const errorMessage = error && (errorMessages[error] || errorMessages.default)

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-red-600">Authentication Error</CardTitle>
          <CardDescription className="text-center">Something went wrong during the authentication process.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <p>{errorMessage}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}