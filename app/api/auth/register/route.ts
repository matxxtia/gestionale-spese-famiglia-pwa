import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { familyName, adminName, adminUsername, adminPassword } = await request.json();

    // Validazione input
    if (!familyName || !adminName || !adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      );
    }

    if (adminPassword.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 6 caratteri' },
        { status: 400 }
      );
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Transazione minimale per creare user + family
    const { user, family } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { 
          name: adminName, 
          username: adminUsername, 
          password: hashedPassword 
        },
      });

      const family = await tx.family.create({
        data: {
          name: familyName,
          members: {
            create: {
              userId: user.id,
              name: adminName,
              role: 'admin',
              sharePercentage: 100,
            },
          },
        },
      });

      return { user, family };
    });

    // Categorie di default (fuori transazione)
    await prisma.category.createMany({
      data: [
        { name: 'Alimentari', icon: 'shopping-cart', color: '#10B981', familyId: family.id },
        { name: 'Trasporti', icon: 'car', color: '#3B82F6', familyId: family.id },
        { name: 'Casa', icon: 'home', color: '#8B5CF6', familyId: family.id },
        { name: 'Salute', icon: 'heart', color: '#EF4444', familyId: family.id },
        { name: 'Svago', icon: 'gamepad-2', color: '#F59E0B', familyId: family.id },
        { name: 'Altro', icon: 'more-horizontal', color: '#6B7280', familyId: family.id },
      ],
    });

    return NextResponse.json(
      { 
        message: 'Gruppo famiglia creato', 
        familyId: family.id, 
        userId: user.id 
      },
      { status: 201 }
    );
  } catch (error) {
    // Gestione errori granulare
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Username già in uso' }, { status: 409 });
      }
    }
    console.error('Register error:', error);
    console.error(JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}