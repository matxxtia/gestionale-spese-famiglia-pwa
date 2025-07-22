import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authOptions } from '../../../../../lib/auth';

const prisma = new PrismaClient();

// Funzione per generare username unico
function generateUsername(name: string): string {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${cleanName}${randomSuffix}`;
}

// Funzione per generare password sicura
function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// GET - Ottieni membri della famiglia
export async function GET(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Verifica che l'utente appartenga alla famiglia
    const familyMember = await prisma.familyMember.findFirst({
      where: {
        familyId: params.familyId,
        userId: session.user.id,
        isActive: true
      }
    });

    if (!familyMember) {
      return NextResponse.json(
        { error: 'Accesso negato alla famiglia' },
        { status: 403 }
      );
    }

    const members = await prisma.familyMember.findMany({
      where: {
        familyId: params.familyId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      orderBy: [
        { role: 'desc' }, // admin prima
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Errore nel recupero dei membri:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Aggiungi nuovo membro alla famiglia
export async function POST(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Verifica che l'utente sia admin della famiglia
    const adminMember = await prisma.familyMember.findFirst({
      where: {
        familyId: params.familyId,
        userId: session.user.id,
        role: 'admin',
        isActive: true
      }
    });

    if (!adminMember) {
      return NextResponse.json(
        { error: 'Solo gli amministratori possono aggiungere membri' },
        { status: 403 }
      );
    }

    const { name, sharePercentage } = await request.json();

    if (!name || sharePercentage === undefined) {
      return NextResponse.json(
        { error: 'Nome e percentuale di ripartizione sono obbligatori' },
        { status: 400 }
      );
    }

    if (sharePercentage < 0 || sharePercentage > 100) {
      return NextResponse.json(
        { error: 'La percentuale deve essere tra 0 e 100' },
        { status: 400 }
      );
    }

    // Genera credenziali uniche
    let username = generateUsername(name);
    let attempts = 0;
    
    // Assicurati che l'username sia unico
    while (attempts < 10) {
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });
      
      if (!existingUser) break;
      
      username = generateUsername(name);
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: 'Impossibile generare un nome utente unico' },
        { status: 500 }
      );
    }

    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 12);

    // Transazione per creare utente e membro famiglia
    const result = await prisma.$transaction(async (tx) => {
      // Crea l'utente
      const newUser = await tx.user.create({
        data: {
          name,
          username,
          password: hashedPassword,
        },
      });

      // Aggiungi come membro della famiglia
      const newMember = await tx.familyMember.create({
        data: {
          familyId: params.familyId,
          userId: newUser.id,
          name,
          role: 'member',
          sharePercentage,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        }
      });

      return { newUser, newMember };
    });

    return NextResponse.json({
      message: 'Membro aggiunto con successo',
      member: result.newMember,
      credentials: {
        username,
        password // Password in chiaro solo per la risposta iniziale
      }
    });
  } catch (error) {
    console.error('Errore nell\'aggiunta del membro:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}