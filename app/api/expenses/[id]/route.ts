import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
// Note: In a real app, authOptions would be imported from a shared config
// For now, we'll skip session validation in mock mode
// import { authOptions } from '../../auth/[...nextauth]/route'

// Mock data - in a real app, this would come from a database
// This should be shared with the main expenses route
let expenses: any[] = []

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Skip session validation for mock mode
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = params
    const body = await request.json()
    const { description, amount, categoryId, location, customSplit } = body

    const expenseIndex = expenses.findIndex(expense => expense.id === id)
    
    if (expenseIndex === -1) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const updatedExpense = {
      ...expenses[expenseIndex],
      description,
      amount: parseFloat(amount),
      categoryId,
      location: location || null,
      customSplit: customSplit || null,
      updatedAt: new Date().toISOString()
    }

    expenses[expenseIndex] = updatedExpense

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Skip session validation for mock mode
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = params
    const expenseIndex = expenses.findIndex(expense => expense.id === id)
    
    if (expenseIndex === -1) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    expenses.splice(expenseIndex, 1)

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}