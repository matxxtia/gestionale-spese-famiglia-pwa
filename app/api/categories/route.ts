import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
// Note: In a real app, authOptions would be imported from a shared config
// For now, we'll skip session validation in mock mode
// import { authOptions } from '../auth/[...nextauth]/route'

// Mock data - in a real app, this would come from a database
let categories: any[] = [
  {
    id: '1',
    name: 'Alimentari',
    color: '#10B981',
    familyId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Trasporti',
    color: '#3B82F6',
    familyId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Intrattenimento',
    color: '#8B5CF6',
    familyId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Salute',
    color: '#EF4444',
    familyId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    // Skip session validation for mock mode
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const familyId = searchParams.get('familyId')

    const filteredCategories = familyId 
      ? categories.filter(category => category.familyId === familyId)
      : categories

    return NextResponse.json(filteredCategories)
  } catch (error) {
    console.error('Error fetching categories:', error)
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
    const { name, color, familyId } = body

    const newCategory = {
      id: Date.now().toString(),
      name,
      color,
      familyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    categories.push(newCategory)

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}