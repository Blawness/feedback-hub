// import { Pool, neonConfig } from '@neondatabase/serverless';
// import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
// import ws from 'ws';

// neonConfig.webSocketConstructor = ws;
// const connectionString = `${process.env.DATABASE_URL}`;

// const pool = new Pool({ connectionString });
// const adapter = new PrismaNeon(pool as any);
// const prisma = new PrismaClient({ adapter, log: ['query'] });

// Use standard Prisma Client for build stability/Node environment
const prisma = new PrismaClient({ log: ['query'] });

export { prisma };
