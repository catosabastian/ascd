// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const dbPath = process.env.DATABASE_URL || "file:dev.db";

console.log('Using SQLite Database file via LibSQL at:', dbPath);

const adapter = new PrismaLibSql({
  url: dbPath
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Attempting to query SimulationRun from SQLite...');
  try {
    const count = await prisma.simulationRun.count();
    console.log('Current SimulationRun count:', count);
    
    console.log('Querying first 5 runs...');
    const runs = await prisma.simulationRun.findMany();
    console.log('Runs successfully queried:', runs);
  } catch (err: any) {
    console.error('DIAGNOSTICS EXCEPTION CAUGHT:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
