'use client';

import Link from 'next/link';

export default function DashboardHome() {
    const quickActions = [
        { href: '/dashboard/cet', icon: '📊', label: 'Calcular CET', desc: 'Custo Efetivo Total' },
        { href: '/dashboard/comparativo', icon: '⚖️', label: 'Comparar Taxas', desc: 'Stone vs Concorrente' },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-[#00A868] p-6 sm:p-8">
                <div className="relative z-10">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        Bem-vindo! 👋
                    </h1>
                    <p className="text-emerald-100 text-sm sm:text-base max-w-lg">
                        Calcule CET, compare taxas e gere propostas profissionais para seus clientes.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                        <Link
                            href="/dashboard/comparativo"
                            className="px-5 py-2.5 bg-white text-[#00A868] font-semibold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg text-center"
                        >
                            Nova Simulação
                        </Link>
                        <Link
                            href="/dashboard/cet"
                            className="px-5 py-2.5 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm text-center"
                        >
                            Calcular CET
                        </Link>
                    </div>
                </div>
                <div className="absolute right-0 top-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action, i) => (
                    <Link
                        key={i}
                        href={action.href}
                        className="flex items-center gap-4 p-5 sm:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-[#00A868]/50 hover:bg-slate-900 transition-all group"
                    >
                        <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform">{action.icon}</span>
                        <div>
                            <p className="font-semibold text-white text-lg">{action.label}</p>
                            <p className="text-sm text-slate-400">{action.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">📊</span>
                        <h3 className="font-semibold text-white">Calculador CET</h3>
                    </div>
                    <p className="text-sm text-slate-400">
                        Calcule o Custo Efetivo Total por bandeira com a fórmula correta MDR + RAV.
                    </p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">⚖️</span>
                        <h3 className="font-semibold text-white">Comparação</h3>
                    </div>
                    <p className="text-sm text-slate-400">
                        Compare Stone vs outras adquirentes e mostre a economia para o cliente.
                    </p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 sm:p-6 sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">📄</span>
                        <h3 className="font-semibold text-white">Exportar</h3>
                    </div>
                    <p className="text-sm text-slate-400">
                        Gere PDF e Excel profissionais com a logo Stone para apresentar aos clientes.
                    </p>
                </div>
            </div>

            {/* Stone Banner */}
            <div className="bg-slate-900/50 border border-[#00A868]/30 rounded-2xl p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-12 h-12 bg-[#00A868] rounded-xl flex items-center justify-center text-white text-xl font-bold">
                        S
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">Stone - Melhores Taxas do Mercado</h3>
                        <p className="text-sm text-slate-400">
                            Antecipação flexível, sem mensalidade, e o melhor atendimento do Brasil.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
