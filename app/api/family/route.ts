import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { getBearerToken, verifyToken } from '../../../lib/jwt'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getAuthContext(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const token = getBearerToken(authHeader)
  if (token) {
    const secret = process.env.NEXTAUTH_SECRET || 'test-secret'
    const payload = verifyToken(token, secret)
    if (payload?.user) {
      return {
        userId: payload.user.id,
        familyId: payload.user.familyId || null,
        tokenValid: true,
      }
    }
  }
  const session = await getServerSession(authOptions)
  if (session?.user) {
    return {
      userId: (session.user as any).id,
      familyId: (session.user as any).familyId || null,
      tokenValid: true,
    }
  }
  return { userId: null as string | null, familyId: null as string | null, tokenValid: false }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.tokenValid || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized or no active family' }, { status: 401 })
    }
    if (!auth.familyId) {
      return NextResponse.json({ error: 'Unauthorized or no active family' }, { status: 401 })
    }

    const family = await prisma.family.findUnique({
      where: {
        id: auth.familyId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        categories: true,
      },
    })

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    return NextResponse.json(family)
  } catch (error) {
    console.error('Error fetching family data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.tokenValid || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome famiglia richiesto' }, { status: 400 })
    }

    // Recupera l'utente per ottenere nome/username
    const currentUser = await prisma.user.findUnique({ where: { id: auth.userId } })
    const adminDisplayName = currentUser?.name || currentUser?.username || 'Admin'

    // Crea la nuova famiglia
    const family = await prisma.family.create({
      data: {
        name,
        members: {
          create: {
            userId: auth.userId,
            name: adminDisplayName,
            role: 'admin',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    })

    // Aggiorna l'utente con il nuovo familyId
    await prisma.user.update({
      where: { id: auth.userId },
      data: { familyId: family.id },
    })

    return NextResponse.json({
      message: 'Famiglia creata con successo',
      family,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating family:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}