import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { getBearerToken, verifyToken } from '@/lib/jwt'

async function getAuthContext(request: NextRequest) {
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.tokenValid || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!auth.familyId) {
      return NextResponse.json({ error: 'No active family found for user' }, { status: 400 })
    }

    const { id } = params
    const body = await request.json()
    const name = (body?.name ?? undefined) as string | undefined
    const color = (body?.color ?? undefined) as string | undefined
    const icon = (body?.icon ?? undefined) as string | undefined

    // Ensure category belongs to user's family
    const existing = await prisma.category.findFirst({ where: { id, familyId: auth.familyId } })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(icon !== undefined ? { icon } : {}),
      },
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Category with this name already exists in the family' }, { status: 409 })
    }
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.tokenValid || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!auth.familyId) {
      return NextResponse.json({ error: 'No active family found for user' }, { status: 400 })
    }

    const { id } = params

    // Ensure category belongs to user's family
    const existing = await prisma.category.findFirst({ where: { id, familyId: auth.familyId } })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    await prisma.category.delete({ where: { id } })

    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}