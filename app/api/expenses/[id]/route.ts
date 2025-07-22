import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { description, amount, categoryId, location } = body

    // Verifica che la spesa esista e appartenga alla famiglia dell'utente
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        family: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    })
    
    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Aggiorna la spesa
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        description,
        amount: parseFloat(amount),
        categoryId,
        location: location || null,
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

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    
    // Verifica che la spesa esista e appartenga alla famiglia dell'utente
    const expense = await prisma.expense.findFirst({
      where: {
        id,
        family: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    })
    
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Elimina la spesa
    await prisma.expense.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}