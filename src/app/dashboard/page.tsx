'use client';

import Link from 'next/link';

export default function DashboardHome() {
    const stats = [
        { label: 'Simulações Este Mês', value: '24', change: '+12%', icon: '📊', color: 'emerald' },
        { label: 'Economia Gerada', value: 'R$ 45.2K', change: '+8%', icon: '💰', color: 'blue' },
        { label: 'Clientes Atendidos', value: '18', change: '+5', icon: '👥', color: 'purple' },
        { label: 'Taxa Média CET', value: '4.2%', change: '-0.3%', icon: '📈', color: 'amber' },
    ];

    const recentSimulations = [
        { client: 'Auto Posto Comaxin', date: '05/02/2026', economy: 'R$ 2.518,14', status: 'Fechado' },
        { client: 'Supermercado BomPreço', date: '04/02/2026', economy: 'R$ 1.890,00', status: 'Proposta' },
        { client: 'Farmácia Popular', date: '03/02/2026', economy: 'R$ 950,00', status: 'Negociando' },
        { client: 'Loja de Roupas ModaFit', date: '02/02/2026', economy: 'R$ 1.234,56', status: 'Fechado' },
    ];

    const quickActions = [
        { href: '/dashboard/cet', icon: '📊', label: 'Calcular CET', desc: 'Custo Efetivo Total por parcela' },
        { href: '/dashboard/comparativo', icon: '⚖️', label: 'Comparar Taxas', desc: 'Concorrente vs Stone' },
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-blue-500 p-8">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Bom dia, Consultor! 👋
                    </h1>
                    <p className="text-emerald-100 max-w-lg">
                        Você tem 3 propostas pendentes e gerou R$ 45.200 em economia para seus clientes este mês.
                    </p>
                    <div className="flex gap-3 mt-6">
                        <Link
                            href="/dashboard/comparativo"
                            className="px-5 py-2.5 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg"
                        >
                            Nova Simulação
                        </Link>
                        <Link
                            href="/dashboard/simulacoes"
                            className="px-5 py-2.5 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm"
                        >
                            Ver Propostas
                        </Link>
                    </div>
                </div>
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute left-1/2 bottom-0 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl translate-y-1/2" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-2xl group-hover:scale-110 transition-transform">{stat.icon}</span>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                        <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Simulations */}
                <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Simulações Recentes</h3>
                        <Link href="/dashboard/simulacoes" className="text-sm text-emerald-400 hover:text-emerald-300">
                            Ver todas →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentSimulations.map((sim, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center text-emerald-400 font-bold">
                                    {sim.client.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white truncate">{sim.client}</p>
                                    <p className="text-sm text-slate-500">{sim.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-emerald-400">{sim.economy}</p>
                                    <p className={`text-xs px-2 py-0.5 rounded-full ${sim.status === 'Fechado' ? 'bg-emerald-500/20 text-emerald-400' :
                                            sim.status === 'Proposta' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-amber-500/20 text-amber-400'
                                        }`}>
                                        {sim.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Ações Rápidas</h3>
                    <div className="space-y-3">
                        {quickActions.map((action, i) => (
                            <Link
                                key={i}
                                href={action.href}
                                className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-xl hover:from-emerald-500/10 hover:to-blue-500/10 border border-transparent hover:border-emerald-500/30 transition-all group"
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                                <div>
                                    <p className="font-medium text-white">{action.label}</p>
                                    <p className="text-sm text-slate-500">{action.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Stone Banner */}
                    <div className="mt-6 p-4 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">S</div>
                            <span className="font-semibold text-white">Stone</span>
                        </div>
                        <p className="text-sm text-slate-400">
                            Melhores taxas do mercado com antecipação flexível e sem mensalidade.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
