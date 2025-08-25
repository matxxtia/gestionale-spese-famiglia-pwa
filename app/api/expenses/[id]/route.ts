import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import { getBearerToken, verifyToken } from '../../../../lib/jwt'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function resolveAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const bearer = getBearerToken(authHeader)
  if (bearer) {
    const secret = process.env.NEXTAUTH_SECRET || 'test-secret'
    const payload = verifyToken(bearer, secret)
    if (payload?.user?.id) {
      return { userId: payload.user.id, familyId: payload.user.familyId as string | null }
    }
  }
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id as string | undefined
  const familyId = (session?.user as any)?.familyId as string | undefined
  return { userId: userId || null, familyId: familyId || null }
}

function parseCustomSplit<T extends { customSplit?: string | null }>(obj: T) {
  const { customSplit, ...rest } = obj as any
  return {
    ...rest,
    customSplit: customSplit ? (typeof customSplit === 'string' ? JSON.parse(customSplit) : customSplit) : undefined,
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await resolveAuth(request)
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { description, amount, categoryId, location, date, paidById, customSplit } = body || {}

    // Verify expense exists and belongs to a family where user is member
    const existingExpense = await prisma.expense.findFirst({
      where: { id, family: { members: { some: { userId: auth.userId } } } },
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Optional: validate category belongs to same family
    if (categoryId) {
      const validCat = await prisma.category.findFirst({ where: { id: categoryId, familyId: existingExpense.familyId } })
      if (!validCat) {
        return NextResponse.json({ error: 'Invalid category for this family' }, { status: 400 })
      }
    }

    // If client passes paidById, validate it's a member of same family
    let effectivePaidById: string | undefined
    if (paidById !== undefined) {
      if (paidById === null) {
        return NextResponse.json({ error: 'paidById cannot be null' }, { status: 400 })
      }
      const member = await prisma.familyMember.findFirst({ where: { id: paidById, familyId: existingExpense.familyId } })
      if (!member) {
        return NextResponse.json({ error: 'Invalid paidById for this family' }, { status: 400 })
      }
      effectivePaidById = member.id
    }

    // Prepare customSplit serialization if provided
    let customSplitSerialized: string | null | undefined
    if (customSplit !== undefined) {
      if (customSplit === null) {
        customSplitSerialized = null
      } else if (typeof customSplit === 'object') {
        try {
          customSplitSerialized = JSON.stringify(customSplit)
        } catch {
          return NextResponse.json({ error: 'Invalid customSplit format' }, { status: 400 })
        }
      } else if (typeof customSplit === 'string') {
        try {
          JSON.parse(customSplit)
          customSplitSerialized = customSplit
        } catch {
          return NextResponse.json({ error: 'Invalid customSplit JSON string' }, { status: 400 })
        }
      } else {
        return NextResponse.json({ error: 'Invalid customSplit type' }, { status: 400 })
      }
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        description,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        categoryId,
        location: location || null,
        date: date ? new Date(date) : undefined,
        paidById: effectivePaidById,
        customSplit: customSplitSerialized,
      },
      include: {
        category: true,
        paidBy: { include: { user: true } },
      },
    })

    return NextResponse.json(parseCustomSplit(updatedExpense))
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await resolveAuth(request)
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const expense = await prisma.expense.findFirst({
      where: { id, family: { members: { some: { userId: auth.userId } } } },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await prisma.expense.delete({ where: { id } })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}