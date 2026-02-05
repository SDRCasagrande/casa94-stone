'use client';

export default function SimulacoesPage() {
    // TODO: Fetch from database when backend is ready
    const simulations: any[] = [];

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Minhas Simulações</h1>
                    <p className="text-slate-400 text-sm">Histórico de comparativos realizados</p>
                </div>
                <a
                    href="/dashboard/comparativo"
                    className="px-4 py-2 bg-[#00A868] hover:bg-[#009960] text-white font-medium rounded-xl transition-all"
                >
                    + Nova Simulação
                </a>
            </div>

            {/* Empty State */}
            {simulations.length === 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Nenhuma simulação salva</h3>
                    <p className="text-slate-400 mb-6">Crie sua primeira simulação para começar a comparar taxas</p>
                    <a
                        href="/dashboard/comparativo"
                        className="inline-block px-6 py-3 bg-[#00A868] hover:bg-[#009960] text-white font-medium rounded-xl transition-all"
                    >
                        Criar Simulação
                    </a>
                </div>
            )}

            {/* Table - Only shows when has data */}
            {simulations.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-800/50">
                                <th className="text-left py-4 px-4 sm:px-6 text-sm font-medium text-slate-400">Cliente</th>
                                <th className="text-left py-4 px-4 sm:px-6 text-sm font-medium text-slate-400">Data</th>
                                <th className="text-right py-4 px-4 sm:px-6 text-sm font-medium text-slate-400">Economia</th>
                                <th className="text-center py-4 px-4 sm:px-6 text-sm font-medium text-slate-400">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {simulations.map((sim: any) => (
                                <tr key={sim.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="py-4 px-4 sm:px-6">
                                        <span className="font-medium text-white">{sim.clientName}</span>
                                    </td>
                                    <td className="py-4 px-4 sm:px-6 text-slate-400">{sim.createdAt}</td>
                                    <td className="py-4 px-4 sm:px-6 text-right font-semibold text-emerald-400">
                                        {formatCurrency(sim.economy)}
                                    </td>
                                    <td className="py-4 px-4 sm:px-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Ver">
                                                👁️
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="PDF">
                                                📄
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
