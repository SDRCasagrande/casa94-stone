'use client';

import { SimulationData, formatCurrency, formatPercent } from '@/lib/calculator';

interface Props {
    simulation: SimulationData;
}

export function ResultsTable({ simulation }: Props) {
    const { results, currentAcquirer, proposedAcquirer, volume } = simulation;
    if (!results) return null;

    return (
        <div className="space-y-6">
            {/* Economia Destaque */}
            <div className={`rounded-xl p-6 text-center ${results.savings > 0 ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
                <p className="text-sm text-slate-400 mb-1">
                    {results.savings > 0 ? '💰 Economia Mensal com' : '⚠️ Custo Adicional com'} {proposedAcquirer.name}
                </p>
                <p className={`text-4xl font-bold ${results.savings > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(Math.abs(results.savings))}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                    {formatPercent(Math.abs(results.savingsPercent))} {results.savings > 0 ? 'de economia' : 'a mais'}
                </p>
                {results.savings > 0 && (
                    <p className="text-emerald-300 font-medium mt-2">
                        📅 Economia Anual: {formatCurrency(results.savingsYearly)}
                    </p>
                )}
            </div>

            {/* Tabela Comparativa */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Item</th>
                            <th className="text-right py-3 px-4 text-red-400 font-medium">{currentAcquirer.name}</th>
                            <th className="text-right py-3 px-4 text-emerald-400 font-medium">{proposedAcquirer.name}</th>
                            <th className="text-right py-3 px-4 text-slate-400 font-medium">Diferença</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-slate-700/50 hover:bg-slate-700/30">
                            <td className="py-3 px-4">💳 Taxa Débito</td>
                            <td className="text-right py-3 px-4 text-red-300">{formatCurrency(results.currentCost.debit)}</td>
                            <td className="text-right py-3 px-4 text-emerald-300">{formatCurrency(results.proposedCost.debit)}</td>
                            <td className={`text-right py-3 px-4 font-medium ${results.currentCost.debit - results.proposedCost.debit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency(results.currentCost.debit - results.proposedCost.debit)}
                            </td>
                        </tr>
                        <tr className="border-b border-slate-700/50 hover:bg-slate-700/30">
                            <td className="py-3 px-4">💳 Taxa Crédito</td>
                            <td className="text-right py-3 px-4 text-red-300">{formatCurrency(results.currentCost.credit1x + results.currentCost.credit2to6 + results.currentCost.credit7to12 + results.currentCost.credit13to18)}</td>
                            <td className="text-right py-3 px-4 text-emerald-300">{formatCurrency(results.proposedCost.credit1x + results.proposedCost.credit2to6 + results.proposedCost.credit7to12 + results.proposedCost.credit13to18)}</td>
                            <td className={`text-right py-3 px-4 font-medium ${(results.currentCost.credit1x + results.currentCost.credit2to6 + results.currentCost.credit7to12 + results.currentCost.credit13to18) - (results.proposedCost.credit1x + results.proposedCost.credit2to6 + results.proposedCost.credit7to12 + results.proposedCost.credit13to18) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency((results.currentCost.credit1x + results.currentCost.credit2to6 + results.currentCost.credit7to12 + results.currentCost.credit13to18) - (results.proposedCost.credit1x + results.proposedCost.credit2to6 + results.proposedCost.credit7to12 + results.proposedCost.credit13to18))}
                            </td>
                        </tr>
                        <tr className="border-b border-slate-700/50 hover:bg-slate-700/30">
                            <td className="py-3 px-4">📱 Taxa PIX</td>
                            <td className="text-right py-3 px-4 text-red-300">{formatCurrency(results.currentCost.pix)}</td>
                            <td className="text-right py-3 px-4 text-emerald-300">{formatCurrency(results.proposedCost.pix)}</td>
                            <td className={`text-right py-3 px-4 font-medium ${results.currentCost.pix - results.proposedCost.pix >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency(results.currentCost.pix - results.proposedCost.pix)}
                            </td>
                        </tr>
                        <tr className="border-b border-slate-700/50 bg-slate-700/20">
                            <td className="py-3 px-4 font-medium">📊 Subtotal Taxas</td>
                            <td className="text-right py-3 px-4 text-red-300 font-medium">{formatCurrency(results.currentCost.subtotal)}</td>
                            <td className="text-right py-3 px-4 text-emerald-300 font-medium">{formatCurrency(results.proposedCost.subtotal)}</td>
                            <td className={`text-right py-3 px-4 font-bold ${results.currentCost.subtotal - results.proposedCost.subtotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency(results.currentCost.subtotal - results.proposedCost.subtotal)}
                            </td>
                        </tr>
                        <tr className="border-b border-slate-700/50 hover:bg-slate-700/30">
                            <td className="py-3 px-4">🖥️ Aluguel Máquinas</td>
                            <td className="text-right py-3 px-4 text-red-300">{formatCurrency(results.currentCost.aluguel)}</td>
                            <td className="text-right py-3 px-4 text-emerald-300">{formatCurrency(results.proposedCost.aluguel)}</td>
                            <td className={`text-right py-3 px-4 font-medium ${results.currentCost.aluguel - results.proposedCost.aluguel >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency(results.currentCost.aluguel - results.proposedCost.aluguel)}
                            </td>
                        </tr>
                        <tr className="bg-slate-700/50 font-semibold">
                            <td className="py-3 px-4">💰 TOTAL MENSAL</td>
                            <td className="text-right py-3 px-4 text-red-300">{formatCurrency(results.currentCost.total)}</td>
                            <td className="text-right py-3 px-4 text-emerald-300">{formatCurrency(results.proposedCost.total)}</td>
                            <td className={`text-right py-3 px-4 ${results.savings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency(results.savings)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* CET por Parcela */}
            <div className="bg-slate-700/30 rounded-xl p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">📈 CET (Custo Efetivo Total) por Parcela - {proposedAcquirer.name}</h3>
                <div className="grid grid-cols-6 md:grid-cols-9 lg:grid-cols-18 gap-1">
                    {results.proposedCost.cetByInstallment.map((cet: number, i: number) => (
                        <div key={i} className="bg-slate-800 rounded-lg p-2 text-center">
                            <span className="text-xs text-slate-400">{i + 1}x</span>
                            <p className="text-xs font-medium text-emerald-300">{formatPercent(cet)}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Volume */}
            <div className="bg-slate-700/30 rounded-xl p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">📊 Volume Transacional (TPV)</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(volume.total)}</p>
            </div>
        </div>
    );
}
