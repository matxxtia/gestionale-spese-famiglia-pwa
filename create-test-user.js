const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash della password 'password'
    const hashedPassword = await bcrypt.hash('password', 10);
    
    // Crea famiglia di test
    const family = await prisma.family.create({
      data: {
        name: 'Famiglia Test'
      }
    });
    
    // Crea utente di test
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@family.com',
        name: 'Test User',
        password: hashedPassword
      }
    });
    
    // Crea membro famiglia
    await prisma.familyMember.create({
      data: {
        familyId: family.id,
        userId: user.id,
        name: 'Test User',
        role: 'admin',
        sharePercentage: 100.0,
        isActive: true
      }
    });
    
    console.log('Utente di test creato:');
    console.log('Username: testuser');
    console.log('Password: password');
    console.log('Famiglia:', family.name);
    
  } catch (error) {
    console.error('Errore durante la creazione dell\'utente di test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();