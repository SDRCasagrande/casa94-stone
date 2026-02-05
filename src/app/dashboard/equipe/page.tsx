'use client';

export default function EquipePage() {
    // TODO: Fetch from database when backend is ready
    const team: any[] = [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Equipe</h1>
                    <p className="text-slate-400 text-sm">Gerencie sua equipe de consultores</p>
                </div>
                <button
                    disabled
                    className="px-4 py-2 bg-slate-700 text-slate-400 font-medium rounded-xl cursor-not-allowed"
                    title="Em breve"
                >
                    + Convidar Membro
                </button>
            </div>

            {/* Empty State */}
            {team.length === 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Nenhum membro na equipe</h3>
                    <p className="text-slate-400">Usuários serão cadastrados pelo administrador</p>
                </div>
            )}

            {/* Team Grid */}
            {team.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {team.map((member: any) => (
                        <div key={member.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-[#00A868] rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                    {member.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                                </div>
                                <div>
                                    <p className="font-semibold text-white">{member.name}</p>
                                    <p className="text-sm text-slate-400">{member.email}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
