import path from 'node:path';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { users } from '../src/db/schema';
import { getAdminAuthConfig, normalizeEmail } from '../src/server/admin-auth';
import { hashPassword } from '../src/server/password';

config({ path: path.resolve(process.cwd(), '.env') });

async function seedAdmin(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes('sample-project')) {
    throw new Error('DATABASE_URL is not configured');
  }

  const auth = getAdminAuthConfig();
  if (!auth.adminPassword) {
    throw new Error('ADMIN_PASSWORD is not set. Add it to .env before seeding the admin user.');
  }

  const email = normalizeEmail(auth.adminEmail);
  const passwordHash = await hashPassword(auth.adminPassword);
  const db = drizzle(neon(databaseUrl));
  const now = new Date();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const id = existing?.id || `usr_admin_${email.replace(/[^a-z0-9]+/g, '_').replace(/_+$/g, '')}`;

  await db
    .insert(users)
    .values({
      id,
      email,
      passwordHash,
      name: auth.adminName,
      role: 'ADMIN',
      institution: 'Research Peptides UK',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash,
        name: auth.adminName,
        role: 'ADMIN',
        institution: 'Research Peptides UK',
        updatedAt: now,
      },
    });

  console.log(`Admin user ready: ${email} (${id})`);
}

seedAdmin().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
