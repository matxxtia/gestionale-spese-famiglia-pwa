import { z } from 'zod';
import 'dotenv/config';

// Schema di validazione per le variabili d'ambiente
const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .refine(
      (url) =>
        url.startsWith('postgresql://') ||
        url.startsWith('postgres://') ||
        url.startsWith('file:'),
      {
        message:
          "DATABASE_URL must start with 'postgresql://', 'postgres://' or 'file:'"
      }
    ),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(30, {
    message: "NEXTAUTH_SECRET must be at least 30 characters long"
  }),
  // Variabili opzionali
  POSTGRES_URL: z.string().optional(),
  PRISMA_DATABASE_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

try {
  const validatedEnv = envSchema.parse(process.env);
  console.log('✅ Environment variables validation passed');
  console.log('📋 Validated variables:');
  console.log(`   - DATABASE_URL: ${validatedEnv.DATABASE_URL ? '✓' : '✗'}`);
  console.log(`   - NEXTAUTH_URL: ${validatedEnv.NEXTAUTH_URL ? '✓' : '✗'}`);
  console.log(`   - NEXTAUTH_SECRET: ${validatedEnv.NEXTAUTH_SECRET ? '✓' : '✗'}`);
} catch (error) {
  console.error('❌ Environment variables validation failed:');
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.error(`   - ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    console.error(error);
  }
  process.exit(1);
}