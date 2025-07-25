import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// Simple in-memory user store for testing (fallback)
const testUsers = [
  {
    id: '1',
    email: 'test@family.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Test User',
    image: null
  },
  {
    id: '2', 
    email: 'admin@family.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Admin User',
    image: null
  }
]

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json()

    if ((!email && !username) || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      )
    }

    let user = null;
    
    try {
      // First try to find user in database by email or username
      if (email) {
        user = await prisma.user.findUnique({
          where: { email },
          include: {
            families: {
              include: {
                family: true
              }
            }
          }
        });
      } else if (username) {
        user = await prisma.user.findUnique({
          where: { username },
          include: {
            families: {
              include: {
                family: true
              }
            }
          }
        });
      }
    } catch (dbError) {
      console.log('Database error, falling back to test users:', dbError instanceof Error ? dbError.message : String(dbError));
    }
    
    // If not found in database, try test users (fallback)
    if (!user && email) {
      const testUser = testUsers.find(u => u.email === email);
      if (testUser) {
        const isValidPassword = await bcrypt.compare(password, testUser.password);
        if (isValidPassword) {
          const { password: _, ...userWithoutPassword } = testUser;
          return NextResponse.json({
            user: userWithoutPassword,
            message: 'Authentication successful'
          });
        }
      }
    }
    
    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Find active family
    const activeFamilyMember = user.families.find(fm => fm.isActive);
    
    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        familyId: activeFamilyMember?.familyId,
        familyName: activeFamilyMember?.family.name,
        role: activeFamilyMember?.role
      },
      message: 'Authentication successful'
    })
    
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}