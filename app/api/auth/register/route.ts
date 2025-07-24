import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { familyName, adminName, adminUsername, adminPassword, adminEmail } = await request.json();

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

    // Verifica se username già esiste
    const existingUser = await prisma.user.findUnique({
      where: { username: adminUsername }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Nome utente già in uso' },
        { status: 400 }
      );
    }

    // Calcola l'email da usare
    const userEmail = adminEmail || `${adminUsername}@famiglia.local`;

    // Verifica se email già esiste
    const existingEmail = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email già in uso' },
        { status: 400 }
      );
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Transazione per creare famiglia e admin
    const result = await prisma.$transaction(async (tx) => {
      // Crea l'utente admin
      const adminUser = await tx.user.create({
        data: {
          name: adminName,
          username: adminUsername,
          email: userEmail,
          password: hashedPassword,
        },
      });

      // Crea la famiglia
      const family = await tx.family.create({
        data: {
          name: familyName,
        },
      });

      // Aggiungi l'admin come membro della famiglia
      const familyMember = await tx.familyMember.create({
        data: {
          familyId: family.id,
          userId: adminUser.id,
          name: adminName,
          role: 'admin',
          sharePercentage: 100.0,
          isActive: true,
        },
      });

      // Aggiorna l'utente con il familyId
      await tx.user.update({
        where: { id: adminUser.id },
        data: { familyId: family.id },
      });

      // Crea categorie di default
      const defaultCategories = [
        { name: 'Alimentari', icon: 'shopping-cart', color: '#10B981' },
        { name: 'Trasporti', icon: 'car', color: '#3B82F6' },
        { name: 'Casa', icon: 'home', color: '#8B5CF6' },
        { name: 'Salute', icon: 'heart', color: '#EF4444' },
        { name: 'Svago', icon: 'gamepad-2', color: '#F59E0B' },
        { name: 'Altro', icon: 'more-horizontal', color: '#6B7280' },
      ];

      await tx.category.createMany({
        data: defaultCategories.map(cat => ({
          ...cat,
          familyId: family.id,
        })),
      });

      return {
        user: adminUser,
        family,
        familyMember,
      };
    });

    return NextResponse.json({
      message: 'Gruppo famiglia creato con successo',
      familyId: result.family.id,
      userId: result.user.id,
    });
  } catch (error) {
    console.error('Errore durante la registrazione:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno del server' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}