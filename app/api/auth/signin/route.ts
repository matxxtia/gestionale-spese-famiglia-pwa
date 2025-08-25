import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../../lib/prisma'
import { getBearerToken, signToken } from '../../../../lib/jwt'

const TEST_USERS = [
  {
    email: 'test@family.com',
    username: 'testuser',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Test User',
  },
  {
    email: 'admin@family.com',
    username: 'admin',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Admin User',
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, password } = body || {}

    if ((!email && !username) || !password) {
      return NextResponse.json({ error: 'Email/username and password are required' }, { status: 400 })
    }

    // Try DB user by email or username
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          username ? { username } : undefined,
        ].filter(Boolean) as any,
      },
      include: {
        families: { include: { family: true } },
      },
    })

    // If not found, try test users fallback
    if (!user) {
      const tu = TEST_USERS.find((u) => (email ? u.email === email : u.username === username))
      if (tu) {
        const ok = await bcrypt.compare(password, tu.password)
        if (!ok) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }
        // Ensure a DB user exists for this test user
        user = await prisma.user.upsert({
          where: { email: tu.email },
          update: {},
          create: {
            email: tu.email,
            username: tu.username,
            name: tu.name,
            password: tu.password,
          },
          include: { families: { include: { family: true } } },
        })
      }
    }

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const activeFamilyMember = user.families.find((fm) => fm.isActive)

    const jwtUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      familyId: activeFamilyMember?.familyId ?? null,
      familyName: activeFamilyMember?.family?.name ?? null,
      role: activeFamilyMember?.role ?? null,
    }

    const secret = process.env.NEXTAUTH_SECRET || 'test-secret'
    const token = signToken(jwtUser, secret, 60 * 60 * 12) // 12h

    return NextResponse.json({ token, user: jwtUser })
  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}