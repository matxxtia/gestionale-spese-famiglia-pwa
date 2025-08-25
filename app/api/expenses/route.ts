import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { getBearerToken, verifyToken } from '../../../lib/jwt'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function resolveAuth(request: NextRequest) {
  // Prefer JWT Bearer
  const authHeader = request.headers.get('authorization')
  const bearer = getBearerToken(authHeader)
  if (bearer) {
    const secret = process.env.NEXTAUTH_SECRET || 'test-secret'
    const payload = verifyToken(bearer, secret)
    if (payload?.user?.id) {
      return { userId: payload.user.id, familyId: payload.user.familyId as string | null }
    }
  }
  // Fallback NextAuth session
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

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuth(request)
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const familyIdParam = searchParams.get('familyId')
    const targetFamilyId = familyIdParam || auth.familyId

    if (!targetFamilyId) {
      return NextResponse.json({ error: 'No family ID available' }, { status: 400 })
    }

    // Ensure the user is member of the target family
    const membership = await prisma.familyMember.findFirst({ where: { userId: auth.userId, familyId: targetFamilyId } })
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden: not a member of this family' }, { status: 403 })
    }

    const expenses = await prisma.expense.findMany({
      where: { familyId: targetFamilyId },
      include: {
        category: true,
        paidBy: { include: { user: true } },
      },
      orderBy: { date: 'desc' },
    })

    // Deserialize customSplit for response
    const mapped = expenses.map((e) => parseCustomSplit(e))
    return NextResponse.json(mapped)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuth(request)
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { description, amount, categoryId, familyId, location, date, paidById, customSplit } = body || {}
    const targetFamilyId: string | null = familyId || auth.familyId

    if (!targetFamilyId) {
      return NextResponse.json({ error: 'No family ID available' }, { status: 400 })
    }

    // Validate category belongs to family (if provided)
    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId is required' }, { status: 400 })
    }
    const category = await prisma.category.findFirst({ where: { id: categoryId, familyId: targetFamilyId } })
    if (!category) {
      return NextResponse.json({ error: 'Invalid category for this family' }, { status: 400 })
    }

    // Determine payer: respect client provided paidById if valid, otherwise fallback to requester membership
    let effectivePaidById: string | null = null
    if (paidById) {
      const payer = await prisma.familyMember.findFirst({ where: { id: paidById, familyId: targetFamilyId } })
      if (!payer) {
        return NextResponse.json({ error: 'Invalid paidById for this family' }, { status: 400 })
      }
      effectivePaidById = payer.id
    } else {
      const me = await prisma.familyMember.findFirst({ where: { userId: auth.userId, familyId: targetFamilyId } })
      if (!me) {
        return NextResponse.json({ error: 'User not found in family' }, { status: 403 })
      }
      effectivePaidById = me.id
    }

    // Serialize customSplit if provided
    let customSplitSerialized: string | null = null
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
        // Accept raw JSON string too, but ensure it parses
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

    // Validate and parse amount (Expense.amount is required in schema)
    const parsedAmount =
      typeof amount === 'string' ? parseFloat(amount) : typeof amount === 'number' ? amount : NaN
    if (amount === undefined || Number.isNaN(parsedAmount)) {
      return NextResponse.json({ error: 'amount is required and must be a valid number' }, { status: 400 })
    }

    const newExpense = await prisma.expense.create({
      data: {
        description,
        amount: parsedAmount,
        categoryId,
        familyId: targetFamilyId,
        location: location || null,
        paidById: effectivePaidById!,
        userId: auth.userId,
        date: date ? new Date(date) : new Date(),
        customSplit: customSplitSerialized ?? undefined,
      },
      include: {
        category: true,
        paidBy: { include: { user: true } },
      },
    })

    const mapped = parseCustomSplit(newExpense)
    return NextResponse.json(mapped, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}