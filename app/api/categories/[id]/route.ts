import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
// Note: In a real app, authOptions would be imported from a shared config
// For now, we'll skip session validation in mock mode
// import { authOptions } from '../../auth/[...nextauth]/route'

// Mock data - in a real app, this would come from a database
// This should be shared with the main categories route
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Skip session validation for mock mode
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = params
    const body = await request.json()
    const { name, color } = body

    const categoryIndex = categories.findIndex(category => category.id === id)
    
    if (categoryIndex === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const updatedCategory = {
      ...categories[categoryIndex],
      name,
      color,
      updatedAt: new Date().toISOString()
    }

    categories[categoryIndex] = updatedCategory

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Error updating category:', error)
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
    const categoryIndex = categories.findIndex(category => category.id === id)
    
    if (categoryIndex === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    categories.splice(categoryIndex, 1)

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}