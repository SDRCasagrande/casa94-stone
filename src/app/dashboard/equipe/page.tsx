'use client';

import { useState, useEffect } from 'react';

interface TeamMember {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    _count: { simulations: number };
}

// Números WhatsApp da equipe (atualize com os números reais)
const TEAM_WHATSAPP: Record<string, string> = {
    'eliel@casa94.com': '5511999999999',
    'mateus@casa94.com': '5511999999999',
    'luciana@casa94.com': '5511999999999',
    'jose@casa94.com': '5511999999999',
    'nayane@casa94.com': '5511999999999',
};

export default function EquipePage() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setTeam(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const shareOnWhatsApp = (phone: string, name: string) => {
        const message = encodeURIComponent(`Olá ${name}! Tenho uma proposta Stone para compartilhar com você.`);
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Equipe Casa 94</h1>
                    <p className="text-slate-400 text-sm">Consultores Stone</p>
                </div>
                <div className="px-4 py-2 bg-[#00A868]/20 border border-[#00A868]/30 rounded-xl text-[#00A868] text-sm">
                    {team.length} consultor{team.length !== 1 ? 'es' : ''} ativo{team.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-2 border-[#00A868] border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!loading && team.length === 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Nenhum membro na equipe</h3>
                    <p className="text-slate-400">Execute o seed para criar os usuários iniciais</p>
                </div>
            )}

            {/* Team Grid */}
            {!loading && team.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {team.map((member) => (
                        <div key={member.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-[#00A868]/50 transition-all group">
                            <div className="flex flex-col items-center text-center">
                                {/* Avatar */}
                                <div className="w-16 h-16 bg-gradient-to-br from-[#00A868] to-[#00A868]/60 rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-3 group-hover:scale-110 transition-transform">
                                    {member.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                                </div>

                                {/* Info */}
                                <p className="font-semibold text-white mb-1">{member.name}</p>
                                <p className="text-xs text-slate-400 mb-3">{member.email}</p>

                                {/* Stats */}
                                <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                                    <span>📊</span>
                                    <span>{member._count?.simulations || 0} simulações</span>
                                </div>

                                {/* WhatsApp Button */}
                                {TEAM_WHATSAPP[member.email] && (
                                    <button
                                        onClick={() => shareOnWhatsApp(TEAM_WHATSAPP[member.email], member.name)}
                                        className="w-full px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg text-green-400 text-xs flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <span>📱</span> WhatsApp
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div>
                    <p className="text-blue-300 text-sm font-medium">Compartilhamento via WhatsApp:</p>
                    <ul className="text-blue-200/70 text-xs mt-1 space-y-1">
                        <li>• Clique no botão WhatsApp de cada consultor</li>
                        <li>• Envie propostas diretamente pelo app</li>
                        <li>• Na página Nova Proposta, use o botão "📱 WhatsApp"</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
