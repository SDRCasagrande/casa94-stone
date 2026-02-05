'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Adquirentes do mercado
const ACQUIRERS = [
    { id: 'stone', name: 'Stone', color: '#00A868', logo: '/logo-stone.png' },
    { id: 'rede', name: 'Rede', color: '#ED1C24', logo: null },
    { id: 'cielo', name: 'Cielo', color: '#0066B3', logo: null },
    { id: 'pagseguro', name: 'PagSeguro', color: '#FFC107', logo: null },
    { id: 'mercadopago', name: 'Mercado Pago', color: '#00B1EA', logo: null },
    { id: 'getnet', name: 'Getnet', color: '#E31B23', logo: null },
    { id: 'safrapay', name: 'Safrapay', color: '#F37021', logo: null },
    { id: 'sumup', name: 'SumUp', color: '#1A1F71', logo: null },
    { id: 'outros', name: 'Outros', color: '#6B7280', logo: null },
];

interface Rates {
    debit: number;
    credit1x: number;
    credit2to6: number;
    credit7to12: number;
    credit13to18: number;
    pix: number;
    rav: number;
}

const DEFAULT_STONE_RATES: Rates = {
    debit: 0.84,
    credit1x: 1.86,
    credit2to6: 2.18,
    credit7to12: 2.41,
    credit13to18: 2.41,
    pix: 0.75,
    rav: 1.30,
};

const DEFAULT_COMPETITOR_RATES: Rates = {
    debit: 1.39,
    credit1x: 2.49,
    credit2to6: 3.19,
    credit7to12: 3.79,
    credit13to18: 3.99,
    pix: 1.19,
    rav: 1.89,
};

export default function ComparativoPage() {
    const [mode, setMode] = useState<'simples' | 'avancado'>('simples');
    const [competitorId, setCompetitorId] = useState('rede');
    const [customName, setCustomName] = useState('');

    // Taxas
    const [stoneRates, setStoneRates] = useState<Rates>(DEFAULT_STONE_RATES);
    const [competitorRates, setCompetitorRates] = useState<Rates>(DEFAULT_COMPETITOR_RATES);

    // Volume e Share
    const [volume, setVolume] = useState(100000);
    const [shareDebit, setShareDebit] = useState(30);
    const [shareCredit, setShareCredit] = useState(50);
    const [sharePix, setSharePix] = useState(20);

    const competitor = ACQUIRERS.find(a => a.id === competitorId) || ACQUIRERS[0];
    const competitorName = competitorId === 'outros' ? customName || 'Outro' : competitor.name;

    // Cálculo do CET
    const calculateCET = (mdr: number, rav: number, parcelas: number) => {
        const mdrDecimal = mdr / 100;
        const ravDecimal = rav / 100;
        const mediaMeses = (parcelas + 1) / 2;
        const cet = 1 - (((100 * (1 - mdrDecimal)) * (1 - (ravDecimal * mediaMeses))) / 100);
        return cet * 100;
    };

    // Calcula custos
    const calculateCosts = (rates: Rates) => {
        const debitVolume = (volume * shareDebit) / 100;
        const creditVolume = (volume * shareCredit) / 100;
        const pixVolume = (volume * sharePix) / 100;

        const debitCost = (debitVolume * rates.debit) / 100;
        const pixCost = (pixVolume * rates.pix) / 100;

        // CET médio do crédito
        const avgCET = calculateCET(rates.credit1x, rates.rav, 6); // média 6x
        const creditCost = (creditVolume * avgCET) / 100;

        return {
            debit: debitCost,
            credit: creditCost,
            pix: pixCost,
            total: debitCost + creditCost + pixCost,
        };
    };

    const stoneCosts = calculateCosts(stoneRates);
    const competitorCosts = calculateCosts(competitorRates);
    const economy = competitorCosts.total - stoneCosts.total;
    const economyPercent = competitorCosts.total > 0 ? (economy / competitorCosts.total) * 100 : 0;

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

    // Exportar PDF
    const exportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header com logo Stone
        doc.setFontSize(24);
        doc.setTextColor(0, 168, 104);
        doc.text('CASA 94', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('Comparativo de Taxas', pageWidth / 2, 28, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 40);
        doc.text(`Volume Mensal: ${formatCurrency(volume)}`, 14, 46);
        doc.text(`Share: Débito ${shareDebit}% | Crédito ${shareCredit}% | PIX ${sharePix}%`, 14, 52);

        // Tabela comparativa
        autoTable(doc, {
            startY: 60,
            head: [['', 'Stone', competitorName, 'Diferença']],
            body: [
                ['Débito', `${stoneRates.debit}%`, `${competitorRates.debit}%`, `${(competitorRates.debit - stoneRates.debit).toFixed(2)}%`],
                ['Crédito 1x', `${stoneRates.credit1x}%`, `${competitorRates.credit1x}%`, `${(competitorRates.credit1x - stoneRates.credit1x).toFixed(2)}%`],
                ['Crédito 2-6x', `${stoneRates.credit2to6}%`, `${competitorRates.credit2to6}%`, `${(competitorRates.credit2to6 - stoneRates.credit2to6).toFixed(2)}%`],
                ['Crédito 7-12x', `${stoneRates.credit7to12}%`, `${competitorRates.credit7to12}%`, `${(competitorRates.credit7to12 - stoneRates.credit7to12).toFixed(2)}%`],
                ['PIX', `${stoneRates.pix}%`, `${competitorRates.pix}%`, `${(competitorRates.pix - stoneRates.pix).toFixed(2)}%`],
                ['RAV', `${stoneRates.rav}%`, `${competitorRates.rav}%`, `${(competitorRates.rav - stoneRates.rav).toFixed(2)}%`],
            ],
            theme: 'striped',
            headStyles: { fillColor: [0, 168, 104] },
        });

        // Custos
        const lastY = (doc as any).lastAutoTable.finalY + 10;
        autoTable(doc, {
            startY: lastY,
            head: [['Custo Mensal', 'Stone', competitorName]],
            body: [
                ['Débito', formatCurrency(stoneCosts.debit), formatCurrency(competitorCosts.debit)],
                ['Crédito', formatCurrency(stoneCosts.credit), formatCurrency(competitorCosts.credit)],
                ['PIX', formatCurrency(stoneCosts.pix), formatCurrency(competitorCosts.pix)],
                ['TOTAL', formatCurrency(stoneCosts.total), formatCurrency(competitorCosts.total)],
            ],
            theme: 'striped',
            headStyles: { fillColor: [0, 168, 104] },
        });

        // Economia
        const economyY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(16);
        doc.setTextColor(0, 168, 104);
        doc.text(`Economia Mensal com Stone: ${formatCurrency(economy)}`, pageWidth / 2, economyY, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Economia Anual: ${formatCurrency(economy * 12)}`, pageWidth / 2, economyY + 8, { align: 'center' });

        doc.save(`Comparativo_Stone_vs_${competitorName}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Exportar Excel
    const exportExcel = () => {
        const wsData = [
            ['CASA 94 - Comparativo de Taxas'],
            [''],
            ['Data:', new Date().toLocaleDateString('pt-BR')],
            ['Volume Mensal:', formatCurrency(volume)],
            ['Share Débito:', `${shareDebit}%`],
            ['Share Crédito:', `${shareCredit}%`],
            ['Share PIX:', `${sharePix}%`],
            [''],
            ['Taxas', 'Stone', competitorName, 'Diferença'],
            ['Débito', `${stoneRates.debit}%`, `${competitorRates.debit}%`, `${(competitorRates.debit - stoneRates.debit).toFixed(2)}%`],
            ['Crédito 1x', `${stoneRates.credit1x}%`, `${competitorRates.credit1x}%`, `${(competitorRates.credit1x - stoneRates.credit1x).toFixed(2)}%`],
            ['Crédito 2-6x', `${stoneRates.credit2to6}%`, `${competitorRates.credit2to6}%`, `${(competitorRates.credit2to6 - stoneRates.credit2to6).toFixed(2)}%`],
            ['Crédito 7-12x', `${stoneRates.credit7to12}%`, `${competitorRates.credit7to12}%`, `${(competitorRates.credit7to12 - stoneRates.credit7to12).toFixed(2)}%`],
            ['PIX', `${stoneRates.pix}%`, `${competitorRates.pix}%`, `${(competitorRates.pix - stoneRates.pix).toFixed(2)}%`],
            ['RAV', `${stoneRates.rav}%`, `${competitorRates.rav}%`, `${(competitorRates.rav - stoneRates.rav).toFixed(2)}%`],
            [''],
            ['Custos Mensais', 'Stone', competitorName],
            ['Débito', formatCurrency(stoneCosts.debit), formatCurrency(competitorCosts.debit)],
            ['Crédito', formatCurrency(stoneCosts.credit), formatCurrency(competitorCosts.credit)],
            ['PIX', formatCurrency(stoneCosts.pix), formatCurrency(competitorCosts.pix)],
            ['TOTAL', formatCurrency(stoneCosts.total), formatCurrency(competitorCosts.total)],
            [''],
            ['ECONOMIA MENSAL', formatCurrency(economy)],
            ['ECONOMIA ANUAL', formatCurrency(economy * 12)],
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Comparativo');
        XLSX.writeFile(wb, `Comparativo_Stone_vs_${competitorName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Comparação de Taxas</h1>
                    <p className="text-slate-400 text-sm">Stone vs Concorrente - Calcule a economia</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Toggle Simples/Avançado */}
                    <div className="flex bg-slate-800 rounded-xl p-1">
                        <button
                            onClick={() => setMode('simples')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'simples' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Simples
                        </button>
                        <button
                            onClick={() => setMode('avancado')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'avancado' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Avançado
                        </button>
                    </div>
                    <button
                        onClick={exportPDF}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium rounded-xl transition-all"
                    >
                        📄 PDF
                    </button>
                    <button
                        onClick={exportExcel}
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 font-medium rounded-xl transition-all"
                    >
                        📊 Excel
                    </button>
                </div>
            </div>

            {/* Volume e Share */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📊 Volume e Share Transacional</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Volume Mensal (R$)</label>
                        <input
                            type="number"
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Débito (%)</label>
                        <input
                            type="number"
                            value={shareDebit}
                            onChange={(e) => setShareDebit(Number(e.target.value))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Crédito (%)</label>
                        <input
                            type="number"
                            value={shareCredit}
                            onChange={(e) => setShareCredit(Number(e.target.value))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">PIX (%)</label>
                        <input
                            type="number"
                            value={sharePix}
                            onChange={(e) => setSharePix(Number(e.target.value))}
                            className={inputClass}
                        />
                    </div>
                </div>
                {shareDebit + shareCredit + sharePix !== 100 && (
                    <p className="text-amber-400 text-sm mt-2">⚠️ Total: {shareDebit + shareCredit + sharePix}% (deve ser 100%)</p>
                )}
            </div>

            {/* Comparativo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stone */}
                <div className="bg-slate-900/50 border-2 border-emerald-500/50 rounded-2xl overflow-hidden">
                    <div className="bg-emerald-500 p-4 flex items-center gap-3">
                        <Image src="/logo-stone.png" alt="Stone" width={80} height={32} className="brightness-0 invert" />
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Débito</label>
                                <div className="relative">
                                    <input type="number" step="0.01" value={stoneRates.debit} onChange={(e) => setStoneRates({ ...stoneRates, debit: Number(e.target.value) })} className={inputClass} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Crédito 1x</label>
                                <div className="relative">
                                    <input type="number" step="0.01" value={stoneRates.credit1x} onChange={(e) => setStoneRates({ ...stoneRates, credit1x: Number(e.target.value) })} className={inputClass} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                                </div>
                            </div>
                        </div>

                        {mode === 'avancado' && (
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">2-6x</label>
                                    <input type="number" step="0.01" value={stoneRates.credit2to6} onChange={(e) => setStoneRates({ ...stoneRates, credit2to6: Number(e.target.value) })} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">7-12x</label>
                                    <input type="number" step="0.01" value={stoneRates.credit7to12} onChange={(e) => setStoneRates({ ...stoneRates, credit7to12: Number(e.target.value) })} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">13-18x</label>
                                    <input type="number" step="0.01" value={stoneRates.credit13to18} onChange={(e) => setStoneRates({ ...stoneRates, credit13to18: Number(e.target.value) })} className={inputClass} />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">PIX</label>
                                <div className="relative">
                                    <input type="number" step="0.01" value={stoneRates.pix} onChange={(e) => setStoneRates({ ...stoneRates, pix: Number(e.target.value) })} className={inputClass} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">RAV (Antecipação)</label>
                                <div className="relative">
                                    <input type="number" step="0.01" value={stoneRates.rav} onChange={(e) => setStoneRates({ ...stoneRates, rav: Number(e.target.value) })} className={inputClass} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Custo Stone */}
                        <div className="pt-4 border-t border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400">Custo Débito</span>
                                <span className="text-white font-medium">{formatCurrency(stoneCosts.debit)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400">Custo Crédito</span>
                                <span className="text-white font-medium">{formatCurrency(stoneCosts.credit)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400">Custo PIX</span>
                                <span className="text-white font-medium">{formatCurrency(stoneCosts.pix)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                                <span className="text-white font-semibold">TOTAL</span>
                                <span className="text-2xl font-bold text-emerald-400">{formatCurrency(stoneCosts.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Concorrente */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-4 flex items-center gap-3" style={{ backgroundColor: competitor.color }}>
                        <select
                            value={competitorId}
                            onChange={(e) => setCompetitorId(e.target.value)}
                            className="bg-white/20 border-0 text-white font-bold text-lg rounded-lg px-3 py-1 focus:ring-2 focus:ring-white/50"
                        >
                            {ACQUIRERS.filter(a => a.id !== 'stone').map(a => (
                                <option key={a.id} value={a.id} className="text-slate-900">{a.name}</option>
                            ))}
                        </select>
                        {competitorId === 'outros' && (
                            <input
                                type="text"
                                placeholder="Nome do concorrente"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                className="bg-white/20 border-0 text-white rounded-lg px-3 py-1 placeholder-white/50"
                            />
                        )}
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Débito</label>
                                <div className="relative">
                                    <input type="number" step="0.01" value={competitorRates.debit} onChange={(e) => setCompetitorRates({ ...competitorRates, debit: Number(e.target.value) })} className={inputClass} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Crédito 1x</label>
                                <div className="relative">
                                    <input type="number" step="0.01" value={competitorRates.credit1x} onChange={(e) => setCompetitorRates({ ...competitorRates, credit1x: Number(e.target.value) })} className={inputClass} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                                </div>
                            </div>
                        </div>

                        {mode === 'avancado' && (
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">2-6x</label>
                                    <input type="number" step="0.01" value={competitorRates.credit2to6} onChange={(e) => setCompetitorRates({ ...competitorRates, credit2to6: Number(e.target.value) })} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">7-12x</label>
                                    <input type="number" step="0.01" value={competitorRates.credit7to12} onChange={(e) => setCompetitorRates({ ...competitorRates, credit7to12: Number(e.target.value) })} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">13-18x</label>
                                    <input type="number" step="0.01" value={competitorRates.credit13to18} onChange={(e) => setCompetitorRates({ ...competitorRates, credit13to18: Number(e.target.value) })} className={inputClass} />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">PIX</label>
                                <div className="relative">
                                    <input type="number" step="0.01" value={competitorRates.pix} onChange={(e) => setCompetitorRates({ ...competitorRates, pix: Number(e.target.value) })} className={inputClass} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">RAV (Antecipação)</label>
                                <div className="relative">
                                    <input type="number" step="0.01" value={competitorRates.rav} onChange={(e) => setCompetitorRates({ ...competitorRates, rav: Number(e.target.value) })} className={inputClass} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Custo Concorrente */}
                        <div className="pt-4 border-t border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400">Custo Débito</span>
                                <span className="text-white font-medium">{formatCurrency(competitorCosts.debit)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400">Custo Crédito</span>
                                <span className="text-white font-medium">{formatCurrency(competitorCosts.credit)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400">Custo PIX</span>
                                <span className="text-white font-medium">{formatCurrency(competitorCosts.pix)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                                <span className="text-white font-semibold">TOTAL</span>
                                <span className="text-2xl font-bold text-red-400">{formatCurrency(competitorCosts.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resultado - Economia */}
            <div className={`rounded-2xl p-8 text-center ${economy > 0 ? 'bg-emerald-500/20 border-2 border-emerald-500/50' : 'bg-red-500/20 border-2 border-red-500/50'}`}>
                <p className="text-slate-300 mb-2">
                    {economy > 0 ? '💰 Economia Mensal com Stone' : '⚠️ Custo Adicional com Stone'}
                </p>
                <p className={`text-5xl font-bold mb-2 ${economy > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(Math.abs(economy))}
                </p>
                <p className="text-slate-400">
                    {economyPercent.toFixed(1)}% {economy > 0 ? 'mais barato' : 'mais caro'} | Economia Anual: <span className="text-white font-semibold">{formatCurrency(Math.abs(economy) * 12)}</span>
                </p>
            </div>
        </div>
    );
}
