import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { getBearerToken, verifyToken } from '../../../../lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const bearer = getBearerToken(authHeader)
    const secret = process.env.NEXTAUTH_SECRET || 'test-secret'

    if (bearer) {
      const payload = verifyToken(bearer, secret)
      if (payload?.user) {
        return NextResponse.json({ user: payload.user })
      }
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // Fallback to NextAuth session
    const session = await getServerSession(authOptions)
    if (session?.user) {
      return NextResponse.json({ user: session.user })
    }

    return NextResponse.json({ user: null })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}