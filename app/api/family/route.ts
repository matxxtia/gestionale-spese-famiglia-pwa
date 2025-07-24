import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.familyId) {
      return NextResponse.json({ error: 'Unauthorized or no active family' }, { status: 401 })
    }

    const family = await prisma.family.findUnique({
      where: {
        id: session.user.familyId,
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome famiglia richiesto' }, { status: 400 })
    }

    // Crea la nuova famiglia
    const family = await prisma.family.create({
      data: {
        name,
                members: {
          create: {
            userId: session.user.id,
            name: session.user.name || session.user.username || 'Admin',
            role: 'ADMIN',
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
      where: { id: session.user.id },
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