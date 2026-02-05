'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Erro ao fazer login');
                return;
            }

            router.push('/dashboard');
        } catch {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-[#00A868] rounded-xl flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">💎</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">CASA 94</h1>
                            <p className="text-[#00A868] text-sm font-medium">Stone Partner</p>
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm">Calculadora de Taxas & CET</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-[#00A868] focus:ring-1 focus:ring-[#00A868] transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-[#00A868] focus:ring-1 focus:ring-[#00A868] transition-all"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#00A868] hover:bg-[#00A868]/90 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '⏳ Entrando...' : '🚀 Entrar'}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-slate-500 text-xs mt-6">
                    © 2026 Casa 94 • Powered by BKaiser Solution
                </p>
            </div>
        </div>
    );
}
