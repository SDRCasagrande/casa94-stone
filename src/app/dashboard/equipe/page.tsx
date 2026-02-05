'use client';

export default function EquipePage() {
    const team = [
        { id: 1, name: 'Carlos Silva', role: 'Gerente', email: 'carlos@stone.com.br', simulations: 45, closed: 32 },
        { id: 2, name: 'Maria Santos', role: 'Consultora', email: 'maria@stone.com.br', simulations: 38, closed: 28 },
        { id: 3, name: 'João Oliveira', role: 'Consultor', email: 'joao@stone.com.br', simulations: 29, closed: 19 },
        { id: 4, name: 'Ana Costa', role: 'Consultora', email: 'ana@stone.com.br', simulations: 22, closed: 15 },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Equipe</h1>
                    <p className="text-slate-400">Gerencie sua equipe de consultores</p>
                </div>
                <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-blue-600 transition-all">
                    + Convidar Membro
                </button>
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {team.map((member) => (
                    <div key={member.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <p className="font-semibold text-white">{member.name}</p>
                                <p className="text-sm text-slate-400">{member.role}</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">{member.email}</p>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                            <div>
                                <p className="text-xs text-slate-400">Simulações</p>
                                <p className="text-lg font-bold text-white">{member.simulations}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Fechados</p>
                                <p className="text-lg font-bold text-emerald-400">{member.closed}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                                    style={{ width: `${(member.closed / member.simulations) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{Math.round((member.closed / member.simulations) * 100)}% conversão</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
