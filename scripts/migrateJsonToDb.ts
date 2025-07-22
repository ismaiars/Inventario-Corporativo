import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

const prisma = new PrismaClient();

async function run() {
  try {
    const usersJson = await fs.readFile('data/users.json', 'utf8').catch(() => '[]');
    const inventoryJson = await fs.readFile('data/inventory.json', 'utf8').catch(() => '[]');
    const users = JSON.parse(usersJson);
    const equipos = JSON.parse(inventoryJson);

    // Limpiar tablas primero
    await prisma.$transaction([
      prisma.equipo.deleteMany(),
      prisma.usuario.deleteMany(),
    ]);

    if (Array.isArray(users)) {
      for (const u of users) {
        await prisma.usuario.create({ data: u });
      }
    }
    if (Array.isArray(equipos)) {
      for (const e of equipos) {
        await prisma.equipo.create({ data: e });
      }
    }
    console.log('Datos migrados a Postgres');
  } catch (err) {
    console.error('Error migrando datos:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run(); 