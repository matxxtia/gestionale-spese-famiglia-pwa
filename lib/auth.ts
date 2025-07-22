import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { NextAuthOptions } from 'next-auth'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // Cerca l'utente nel database
          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
            include: {
              families: {
                include: {
                  family: true
                }
              }
            }
          })
          
          if (!user || !user.password) {
            return null
          }

          // Verifica la password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValidPassword) {
            return null
          }

          // Trova la famiglia attiva dell'utente
          const activeFamilyMember = user.families.find(fm => fm.isActive)
          
          return {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            image: user.image,
            familyId: activeFamilyMember?.familyId,
            familyName: activeFamilyMember?.family.name,
            role: activeFamilyMember?.role
          }
        } catch (error) {
          console.error('Errore durante l\'autenticazione:', error)
          return null
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
    }),
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.familyId = user.familyId
        token.familyName = user.familyName
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token?.id) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.familyId = token.familyId as string
        session.user.familyName = token.familyName as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}