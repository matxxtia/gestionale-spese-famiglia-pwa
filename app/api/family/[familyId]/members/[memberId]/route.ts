import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../../../../lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


// DELETE - Elimina membro dalla famiglia
export async function DELETE(
  request: NextRequest,
  { params }: { params: { familyId: string; memberId: string } }
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
        { error: 'Solo gli amministratori possono eliminare membri' },
        { status: 403 }
      );
    }

    // Verifica che il membro da eliminare esista e non sia admin
    const memberToDelete = await prisma.familyMember.findFirst({
      where: {
        id: params.memberId,
        familyId: params.familyId
      },
      include: {
        user: true
      }
    });

    if (!memberToDelete) {
      return NextResponse.json(
        { error: 'Membro non trovato' },
        { status: 404 }
      );
    }

    if (memberToDelete.role === 'admin') {
      return NextResponse.json(
        { error: 'Non è possibile eliminare un amministratore' },
        { status: 400 }
      );
    }

    // Transazione per eliminare membro e utente associato
    await prisma.$transaction(async (tx) => {
      // Prima elimina il membro dalla famiglia
      await tx.familyMember.delete({
        where: {
          id: params.memberId
        }
      });

      // Poi elimina l'utente se non ha altre famiglie
      const otherFamilyMemberships = await tx.familyMember.findMany({
        where: {
          userId: memberToDelete.userId,
          id: { not: params.memberId }
        }
      });

      if (otherFamilyMemberships.length === 0) {
        await tx.user.delete({
          where: {
            id: memberToDelete.userId
          }
        });
      }
    });

    return NextResponse.json({
      message: 'Membro eliminato con successo'
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione del membro:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  } finally {
    // Prisma handled via global instance
  }
}

// PUT - Aggiorna membro della famiglia
export async function PUT(
  request: NextRequest,
  { params }: { params: { familyId: string; memberId: string } }
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
        { error: 'Solo gli amministratori possono modificare membri' },
        { status: 403 }
      );
    }

    const { name, sharePercentage, isActive } = await request.json();

    // Verifica che il membro esista
    const memberToUpdate = await prisma.familyMember.findFirst({
      where: {
        id: params.memberId,
        familyId: params.familyId
      }
    });

    if (!memberToUpdate) {
      return NextResponse.json(
        { error: 'Membro non trovato' },
        { status: 404 }
      );
    }

    if (sharePercentage !== undefined && (sharePercentage < 0 || sharePercentage > 100)) {
      return NextResponse.json(
        { error: 'La percentuale deve essere tra 0 e 100' },
        { status: 400 }
      );
    }

    // Aggiorna il membro
    const updatedMember = await prisma.familyMember.update({
      where: {
        id: params.memberId
      },
      data: {
        ...(name && { name }),
        ...(sharePercentage !== undefined && { sharePercentage }),
        ...(isActive !== undefined && { isActive })
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

    // Se il nome è cambiato, aggiorna anche l'utente
    if (name && name !== memberToUpdate.name) {
      await prisma.user.update({
        where: {
          id: memberToUpdate.userId
        },
        data: {
          name
        }
      });
    }

    return NextResponse.json({
      message: 'Membro aggiornato con successo',
      member: updatedMember
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento del membro:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  } finally {
    // Prisma handled via global instance
  }
}