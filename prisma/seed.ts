import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('Stone-001', 12);

    const users = [
        { email: 'eliel@casa94.com', name: 'Eliel', password },
        { email: 'mateus@casa94.com', name: 'Mateus', password },
        { email: 'luciana@casa94.com', name: 'Luciana', password },
        { email: 'jose@casa94.com', name: 'José', password },
        { email: 'nayane@casa94.com', name: 'Nayane', password },
    ];

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: user,
        });
        console.log(`✅ Usuário criado: ${user.email}`);
    }

    console.log('\n🎉 Seed concluído! Todos os usuários têm senha: Stone-001');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
