import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import * as path from 'path';

// Using a robust fallback URL for SQLite if env var is missing or invalid.
const devDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const fallbackUrl = `file:${devDbPath}`;

// Make sure that we are creating a singleton instance of prisma to avoid hitting connection limits
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL?.startsWith('file:') 
               ? process.env.DATABASE_URL 
               : fallbackUrl,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
