import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const familyIdParam = searchParams.get('familyId')
    const targetFamilyId = familyIdParam || session.user.familyId

    if (!targetFamilyId) {
      return NextResponse.json({ error: 'No family ID available' }, { status: 400 })
    }

    // Ottieni le spese della famiglia dell'utente
    const expenses = await prisma.expense.findMany({
      where: {
        familyId: targetFamilyId,
        family: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      },
      include: {
        category: true,
        paidBy: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
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
    const { description, amount, categoryId, familyId, location, date } = body
    const targetFamilyId = familyId || session.user.familyId

    if (!targetFamilyId) {
      return NextResponse.json({ error: 'No family ID available' }, { status: 400 })
    }

    // Trova il membro famiglia dell'utente
    const familyMember = await prisma.familyMember.findFirst({
      where: {
        userId: session.user.id,
        familyId: targetFamilyId
      }
    })

    if (!familyMember) {
      return NextResponse.json({ error: 'User not found in family' }, { status: 403 })
    }

    // Crea la nuova spesa
    const newExpense = await prisma.expense.create({
      data: {
        description,
        amount: parseFloat(amount),
        categoryId,
        familyId: targetFamilyId,
        location: location || null,
        paidById: familyMember.id,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        category: true,
        paidBy: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json(newExpense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}