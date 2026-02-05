import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Preencha email e senha' }, { status: 400 });
        }

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
        }

        // Check if active
        if (!user.isActive) {
            return NextResponse.json({ error: 'Conta desativada' }, { status: 403 });
        }

        // Generate token
        const token = generateToken({ userId: user.id, email: user.email, name: user.name });

        const response = NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, name: user.name }
        });

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 });
    }
}
