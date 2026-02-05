'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

const menuItems = [
    { href: '/dashboard', icon: '🏠', label: 'Início' },
    { href: '/dashboard/cet', icon: '📊', label: 'Calculador CET' },
    { href: '/dashboard/comparativo', icon: '⚖️', label: 'Comparação de Taxas' },
    { href: '/dashboard/simulacoes', icon: '📁', label: 'Minhas Simulações' },
    { href: '/dashboard/equipe', icon: '👥', label: 'Equipe' },
];

export default function DashboardLayout({ children }: Props) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
                            94
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">CASA 94</h1>
                            <p className="text-xs text-slate-500">Simulador de Taxas</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-white border border-emerald-500/30'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                    }`}
                            >
                                <span className={`text-lg ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                                    {item.icon}
                                </span>
                                <span className="font-medium">{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-xl">
                        <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            SC
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">Stone Consultor</p>
                            <p className="text-xs text-slate-500">Equipe Vendas</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Top Bar */}
                <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                {menuItems.find(m => m.href === pathname)?.label || 'Dashboard'}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                🔔
                            </button>
                            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                ⚙️
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
