import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Lista todos os usuários da equipe
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: { isActive: true },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                _count: { select: { simulations: true } }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
    }
}
