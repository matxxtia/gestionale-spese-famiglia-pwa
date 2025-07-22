import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string | null
      familyId?: string | null
      familyName?: string | null
      role?: string | null
    }
  }

  interface User {
    id: string
    username?: string | null
    familyId?: string | null
    familyName?: string | null
    role?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username?: string | null
    familyId?: string | null
    familyName?: string | null
    role?: string | null
  }
}