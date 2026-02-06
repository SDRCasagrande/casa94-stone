'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';

interface Props {
    children: ReactNode;
}

const menuItems = [
    { href: '/dashboard', icon: '🏠', label: 'Início' },
    { href: '/dashboard/cet', icon: '📊', label: 'Calculador CET' },
    { href: '/dashboard/comparativo', icon: '⚖️', label: 'Comparação de Taxas' },
    { href: '/dashboard/proposta', icon: '📋', label: 'Nova Proposta' },
    { href: '/dashboard/simulacoes', icon: '📁', label: 'Minhas Propostas' },
    { href: '/dashboard/equipe', icon: '👥', label: 'Equipe' },
];

export default function DashboardLayout({ children }: Props) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-900 border-r border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Logo */}
                <div className="p-4 sm:p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#00A868] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#00A868]/30">
                            94
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-white">CASA 94</h1>
                            <p className="text-xs text-slate-500">Simulador de Taxas</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-[#00A868]/20 text-white border border-[#00A868]/30'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                    }`}
                            >
                                <span className={`text-lg ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                                    {item.icon}
                                </span>
                                <span className="font-medium text-sm sm:text-base">{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00A868] animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info */}
                <div className="p-3 sm:p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-slate-800/50 rounded-xl">
                        <div className="w-9 h-9 bg-[#00A868] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            U
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">Usuário</p>
                            <p className="text-xs text-slate-500">Consultor</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <div className="flex-1 min-w-0">
                            <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                                {menuItems.find(m => m.href === pathname)?.label || 'Dashboard'}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
                                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                🔔
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
