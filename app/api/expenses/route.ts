import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
// Note: In a real app, authOptions would be imported from a shared config
// For now, we'll skip session validation in mock mode
// import { authOptions } from '../auth/[...nextauth]/route'

// Mock data - in a real app, this would come from a database
let expenses: any[] = []

export async function GET(request: NextRequest) {
  try {
    // Skip session validation for mock mode
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const familyId = searchParams.get('familyId')

    const filteredExpenses = familyId 
      ? expenses.filter(expense => expense.familyId === familyId)
      : expenses

    return NextResponse.json(filteredExpenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Skip session validation for mock mode
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { description, amount, categoryId, familyId, location, customSplit } = body

    const newExpense = {
      id: Date.now().toString(),
      description,
      amount: parseFloat(amount),
      categoryId,
      familyId,
      location: location || null,
      customSplit: customSplit || null,
      userId: '1', // Mock user ID
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    expenses.push(newExpense)

    return NextResponse.json(newExpense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}