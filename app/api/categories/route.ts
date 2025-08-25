import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { getBearerToken, verifyToken } from '@/lib/jwt'

async function getAuthContext(request: NextRequest) {
  // Prefer Bearer token (used by tests), fallback to NextAuth session
  const authHeader = request.headers.get('authorization') || ''
  const token = getBearerToken(authHeader)
  if (token) {
    const secret = process.env.NEXTAUTH_SECRET || 'test-secret'
    const payload = verifyToken(token, secret)
    if (payload && payload.user) {
      return {
        userId: payload.user.id,
        familyId: payload.user.familyId || null,
        tokenValid: true,
      }
    }
  }

  const session = await getServerSession(authOptions)
  if (session && session.user) {
    return {
      userId: (session.user as any).id,
      familyId: (session.user as any).familyId || null,
      tokenValid: true,
    }
  }

  return { userId: null, familyId: null, tokenValid: false }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.tokenValid || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!auth.familyId) {
      return NextResponse.json({ error: 'No active family found for user' }, { status: 400 })
    }

    const categories = await prisma.category.findMany({
      where: { familyId: auth.familyId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(categories, { status: 200 })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.tokenValid || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!auth.familyId) {
      return NextResponse.json({ error: 'No active family found for user' }, { status: 400 })
    }

    const body = await request.json()
    const name = (body?.name ?? '').toString().trim()
    const icon = (body?.icon ?? undefined) as string | undefined
    const color = (body?.color ?? undefined) as string | undefined

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    try {
      const category = await prisma.category.create({
        data: {
          name,
          icon: icon ?? undefined,
          color: color ?? undefined,
          familyId: auth.familyId,
        },
      })

      return NextResponse.json(category, { status: 201 })
    } catch (e: any) {
      // Handle unique constraint (familyId, name)
      if (e.code === 'P2002') {
        return NextResponse.json({ error: 'Category with this name already exists in the family' }, { status: 409 })
      }
      throw e
    }
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}