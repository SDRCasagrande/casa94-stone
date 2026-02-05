'use client';

import { useState, useMemo } from 'react';
import { calculateCET, formatPercent, formatCurrency } from '@/lib/calculator';

export default function CETCalculator() {
    // Taxas MDR
    const [mdrDebit, setMdrDebit] = useState(0.84);
    const [mdrCredit1x, setMdrCredit1x] = useState(1.86);
    const [mdrCredit2to6, setMdrCredit2to6] = useState(2.18);
    const [mdrCredit7to12, setMdrCredit7to12] = useState(2.41);
    const [mdrCredit13to18, setMdrCredit13to18] = useState(2.41);
    const [ravRate, setRavRate] = useState(1.30);
    const [pixRate, setPixRate] = useState(0.75);

    // Share Transacional (%)
    const [shareDebit, setShareDebit] = useState(30);
    const [shareCredit, setShareCredit] = useState(50);
    const [sharePix, setSharePix] = useState(20);

    // Volume
    const [totalVolume, setTotalVolume] = useState(100000);

    // Calcula CET para cada parcela
    const cetTable = useMemo(() => {
        return Array.from({ length: 18 }, (_, i) => {
            const parcelas = i + 1;
            let mdr = mdrCredit1x;
            if (parcelas >= 2 && parcelas <= 6) mdr = mdrCredit2to6;
            if (parcelas >= 7 && parcelas <= 12) mdr = mdrCredit7to12;
            if (parcelas >= 13) mdr = mdrCredit13to18;

            const cet = calculateCET(mdr, ravRate, parcelas);
            return { parcelas, mdr, cet };
        });
    }, [mdrCredit1x, mdrCredit2to6, mdrCredit7to12, mdrCredit13to18, ravRate]);

    // Calcula custo total
    const costs = useMemo(() => {
        const debitVolume = (totalVolume * shareDebit) / 100;
        const creditVolume = (totalVolume * shareCredit) / 100;
        const pixVolume = (totalVolume * sharePix) / 100;

        const debitCost = (debitVolume * mdrDebit) / 100;
        const pixCost = (pixVolume * pixRate) / 100;

        // Média ponderada do crédito (assumindo distribuição uniforme)
        const avgCET = cetTable.reduce((sum, c) => sum + c.cet, 0) / 18;
        const creditCost = (creditVolume * avgCET) / 100;

        return {
            debit: { volume: debitVolume, cost: debitCost, rate: mdrDebit },
            credit: { volume: creditVolume, cost: creditCost, rate: avgCET },
            pix: { volume: pixVolume, cost: pixCost, rate: pixRate },
            total: debitCost + creditCost + pixCost,
        };
    }, [totalVolume, shareDebit, shareCredit, sharePix, mdrDebit, pixRate, cetTable]);

    const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all";

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Calculador de CET</h1>
                <p className="text-slate-400">Calcule o Custo Efetivo Total considerando MDR + RAV</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Taxas MDR */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        📊 Taxas MDR
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Débito (%)</label>
                            <input type="number" step="0.01" value={mdrDebit} onChange={(e) => setMdrDebit(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Crédito 1x (%)</label>
                            <input type="number" step="0.01" value={mdrCredit1x} onChange={(e) => setMdrCredit1x(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Crédito 2-6x (%)</label>
                            <input type="number" step="0.01" value={mdrCredit2to6} onChange={(e) => setMdrCredit2to6(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Crédito 7-12x (%)</label>
                            <input type="number" step="0.01" value={mdrCredit7to12} onChange={(e) => setMdrCredit7to12(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Crédito 13-18x (%)</label>
                            <input type="number" step="0.01" value={mdrCredit13to18} onChange={(e) => setMdrCredit13to18(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div className="pt-4 border-t border-slate-700">
                            <label className="block text-sm text-slate-400 mb-2">RAV - Antecipação/mês (%)</label>
                            <input type="number" step="0.01" value={ravRate} onChange={(e) => setRavRate(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">PIX (%)</label>
                            <input type="number" step="0.01" value={pixRate} onChange={(e) => setPixRate(Number(e.target.value))} className={inputClass} />
                        </div>
                    </div>
                </div>

                {/* Share Transacional */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        📈 Share Transacional
                    </h3>

                    <div className="mb-6">
                        <label className="block text-sm text-slate-400 mb-2">Volume Total (R$)</label>
                        <input type="number" value={totalVolume} onChange={(e) => setTotalVolume(Number(e.target.value))} className={inputClass} />
                    </div>

                    <div className="space-y-6">
                        {/* Débito */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-slate-400">💳 Débito</span>
                                <span className="text-sm font-medium text-white">{shareDebit}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100"
                                value={shareDebit}
                                onChange={(e) => setShareDebit(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">{formatCurrency(costs.debit.volume)}</p>
                        </div>

                        {/* Crédito */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-slate-400">💳 Crédito</span>
                                <span className="text-sm font-medium text-white">{shareCredit}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100"
                                value={shareCredit}
                                onChange={(e) => setShareCredit(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">{formatCurrency(costs.credit.volume)}</p>
                        </div>

                        {/* PIX */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-slate-400">📱 PIX</span>
                                <span className="text-sm font-medium text-white">{sharePix}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100"
                                value={sharePix}
                                onChange={(e) => setSharePix(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">{formatCurrency(costs.pix.volume)}</p>
                        </div>

                        {/* Total Check */}
                        <div className={`p-3 rounded-xl ${shareDebit + shareCredit + sharePix === 100 ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-amber-500/20 border border-amber-500/30'}`}>
                            <p className={`text-sm font-medium ${shareDebit + shareCredit + sharePix === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                Total: {shareDebit + shareCredit + sharePix}%
                                {shareDebit + shareCredit + sharePix !== 100 && ' (Deve ser 100%)'}
                            </p>
                        </div>
                    </div>

                    {/* Custo Resumo */}
                    <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Taxa Débito</span>
                            <span className="text-white font-medium">{formatCurrency(costs.debit.cost)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Taxa Crédito</span>
                            <span className="text-white font-medium">{formatCurrency(costs.credit.cost)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Taxa PIX</span>
                            <span className="text-white font-medium">{formatCurrency(costs.pix.cost)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                            <span className="text-white font-semibold">Custo Total</span>
                            <span className="text-2xl font-bold text-emerald-400">{formatCurrency(costs.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Tabela CET */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        📋 CET por Parcela
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">MDR + RAV ({ravRate}%/mês)</p>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                        {cetTable.map((row) => (
                            <div
                                key={row.parcelas}
                                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-white">
                                        {row.parcelas}x
                                    </span>
                                    <span className="text-sm text-slate-400">MDR {formatPercent(row.mdr)}</span>
                                </div>
                                <span className={`text-lg font-bold ${row.cet < 5 ? 'text-emerald-400' :
                                        row.cet < 10 ? 'text-amber-400' : 'text-red-400'
                                    }`}>
                                    {formatPercent(row.cet)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
