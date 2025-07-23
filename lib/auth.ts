import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { NextAuthOptions } from 'next-auth'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('Authorize function called with credentials:', credentials?.username);

        if (!credentials?.username || !credentials?.password) {
          throw new Error('Please provide username and password.');
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
          });

          if (!user || !user.password) {
            console.error('User not found or password not set for:', credentials.username);
            throw new Error('Invalid credentials');
          }

          // Verifica la password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);

          if (!isValidPassword) {
            console.error('Invalid password for user:', credentials.username);
            throw new Error('Invalid credentials');
          }

          console.log('User authenticated successfully:', user.username);
          // Trova la famiglia attiva dell'utente
          const activeFamilyMember = user.families.find(fm => fm.isActive);

          return {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            image: user.image,
            familyId: activeFamilyMember?.familyId,
            familyName: activeFamilyMember?.family.name,
            role: activeFamilyMember?.role
          };
        } catch (error) {
          console.error('Authentication error:', error);
          if (error instanceof Error) {
            throw new Error(error.message || 'An authentication error occurred.');
          }
          throw new Error('An authentication error occurred.');
        }
      }
    })
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
    error: '/auth/error',
  },
}