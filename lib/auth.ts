import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { NextAuthOptions } from 'next-auth'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
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
          throw new Error('MISSING_CREDENTIALS');
        }

        try {
          // Cerca l'utente nel database per username o email
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: credentials.username },
                { email: credentials.username }
              ]
            },
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
            throw new Error('INVALID_CREDENTIALS');
          }

          // Verifica la password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);

          if (!isValidPassword) {
            console.error('Invalid password for user:', credentials.username);
            throw new Error('INVALID_CREDENTIALS');
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
            // Sanitizza il messaggio di errore per evitare caratteri non validi negli header HTTP
            const sanitizedMessage = error.message.replace(/[\r\n\t]/g, ' ').trim();
            throw new Error(sanitizedMessage || 'AUTH_ERROR');
          }
          throw new Error('AUTH_ERROR');
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