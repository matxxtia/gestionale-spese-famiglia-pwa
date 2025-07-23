import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

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