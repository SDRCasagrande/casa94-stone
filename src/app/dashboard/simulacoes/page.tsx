'use client';

export default function SimulacoesPage() {
    const simulations = [
        { id: 1, client: 'Auto Posto Comaxin', date: '05/02/2026', economy: 2518.14, status: 'Fechado', volume: 2000000 },
        { id: 2, client: 'Supermercado BomPreço', date: '04/02/2026', economy: 1890.00, status: 'Proposta', volume: 500000 },
        { id: 3, client: 'Farmácia Popular', date: '03/02/2026', economy: 950.00, status: 'Negociando', volume: 150000 },
        { id: 4, client: 'Loja ModaFit', date: '02/02/2026', economy: 1234.56, status: 'Fechado', volume: 80000 },
        { id: 5, client: 'Padaria Sabor & Arte', date: '01/02/2026', economy: 456.00, status: 'Perdido', volume: 45000 },
    ];

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Fechado': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'Proposta': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Negociando': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'Perdido': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Minhas Simulações</h1>
                    <p className="text-slate-400">Histórico de comparativos realizados</p>
                </div>
                <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-blue-600 transition-all">
                    + Nova Simulação
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <p className="text-sm text-slate-400">Total</p>
                    <p className="text-2xl font-bold text-white">{simulations.length}</p>
                </div>
                <div className="bg-slate-900/50 border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-sm text-slate-400">Fechados</p>
                    <p className="text-2xl font-bold text-emerald-400">{simulations.filter(s => s.status === 'Fechado').length}</p>
                </div>
                <div className="bg-slate-900/50 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-sm text-slate-400">Em Negociação</p>
                    <p className="text-2xl font-bold text-amber-400">{simulations.filter(s => s.status === 'Negociando' || s.status === 'Proposta').length}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <p className="text-sm text-slate-400">Economia Total</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(simulations.reduce((sum, s) => sum + s.economy, 0))}</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-800/50">
                            <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Cliente</th>
                            <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Data</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Volume</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Economia</th>
                            <th className="text-center py-4 px-6 text-sm font-medium text-slate-400">Status</th>
                            <th className="text-center py-4 px-6 text-sm font-medium text-slate-400">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {simulations.map((sim) => (
                            <tr key={sim.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center text-emerald-400 font-bold">
                                            {sim.client.charAt(0)}
                                        </div>
                                        <span className="font-medium text-white">{sim.client}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-slate-400">{sim.date}</td>
                                <td className="py-4 px-6 text-right text-slate-300">{formatCurrency(sim.volume)}</td>
                                <td className="py-4 px-6 text-right font-semibold text-emerald-400">{formatCurrency(sim.economy)}</td>
                                <td className="py-4 px-6 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(sim.status)}`}>
                                        {sim.status}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Ver">
                                            👁️
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Editar">
                                            ✏️
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
        </div>
    );
}
