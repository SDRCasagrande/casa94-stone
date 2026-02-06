import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

// Endpoint único para criar usuários iniciais
// Acesse uma vez: /api/seed?key=casa94-setup-2026
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    // Proteção simples
    if (key !== 'casa94-setup-2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const users = [
            { email: 'eliel@casa94.com', name: 'Eliel' },
            { email: 'mateus@casa94.com', name: 'Mateus' },
            { email: 'luciana@casa94.com', name: 'Luciana' },
            { email: 'jose@casa94.com', name: 'José' },
            { email: 'nayane@casa94.com', name: 'Nayane' },
            { email: 'wilson@casa94.com', name: 'Wilson' },
        ];

        const password = await hashPassword('Stone-001');
        const created = [];

        for (const user of users) {
            await prisma.user.upsert({
                where: { email: user.email },
                update: {},
                create: { ...user, password },
            });
            created.push(user.email);
        }

        return NextResponse.json({
            success: true,
            message: 'Usuários criados com sucesso!',
            users: created,
            defaultPassword: 'Stone-001'
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: 'Erro ao criar usuários' }, { status: 500 });
    }
}
