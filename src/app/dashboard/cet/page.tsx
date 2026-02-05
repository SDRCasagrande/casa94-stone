'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Logo placeholder - será substituída pela logo real
const LOGO_BASE64 = ''; // User enviará a logo

interface BrandContainer {
    id: string;
    name: string;
    debit: number;
    credit1x: number;
    credit2to6: number;
    credit7to12: number;
    credit13to18: number;
}

const DEFAULT_BRANDS = [
    { name: 'VISA/MASTER', debit: 0.84, credit1x: 1.86, credit2to6: 2.18, credit7to12: 2.41, credit13to18: 2.41 },
    { name: 'ELO', debit: 1.19, credit1x: 2.28, credit2to6: 2.66, credit7to12: 2.98, credit13to18: 2.98 },
    { name: 'AMEX', debit: 0, credit1x: 2.39, credit2to6: 2.85, credit7to12: 3.20, credit13to18: 3.20 },
    { name: 'HIPERCARD', debit: 0, credit1x: 2.15, credit2to6: 2.55, credit7to12: 2.90, credit13to18: 2.90 },
    { name: 'CABAL', debit: 0.99, credit1x: 1.99, credit2to6: 2.35, credit7to12: 2.70, credit13to18: 2.70 },
];

export default function CETCalculator() {
    const [ravRate, setRavRate] = useState(1.30);
    const [containers, setContainers] = useState<BrandContainer[]>([
        { id: '1', name: 'VISA/MASTER', debit: 0.84, credit1x: 1.86, credit2to6: 2.18, credit7to12: 2.41, credit13to18: 2.41 },
    ]);

    // Salva dados no localStorage para sincronizar com página de comparação
    useEffect(() => {
        localStorage.setItem('casa94_stone_rates', JSON.stringify({ ravRate, containers }));
    }, [ravRate, containers]);

    // Calcula CET com a fórmula correta
    // Para nx: média de meses = (1 + 2 + ... + n) / n = (n + 1) / 2
    // CET = 1 - (((100 * (1 - MDR)) * (1 - (RAV * mediaMeses))) / 100)
    const calculateCET = (mdr: number, parcelas: number) => {
        const mdrDecimal = mdr / 100;
        const ravDecimal = ravRate / 100;
        const mediaMeses = (parcelas + 1) / 2; // Média das parcelas em meses
        const cet = 1 - (((100 * (1 - mdrDecimal)) * (1 - (ravDecimal * mediaMeses))) / 100);
        return cet * 100; // Retorna em %
    };

    // Adiciona novo container
    const addContainer = () => {
        const nextBrand = DEFAULT_BRANDS[containers.length % DEFAULT_BRANDS.length];
        setContainers([...containers, {
            id: Date.now().toString(),
            ...nextBrand,
        }]);
    };

    // Remove container
    const removeContainer = (id: string) => {
        if (containers.length > 1) {
            setContainers(containers.filter(c => c.id !== id));
        }
    };

    // Atualiza container
    const updateContainer = (id: string, field: keyof BrandContainer, value: string | number) => {
        setContainers(containers.map(c =>
            c.id === id ? { ...c, [field]: value } : c
        ));
    };

    // Aplica preset de bandeira
    const applyPreset = (id: string, brandName: string) => {
        const preset = DEFAULT_BRANDS.find(b => b.name === brandName);
        if (preset) {
            setContainers(containers.map(c =>
                c.id === id ? { ...c, ...preset } : c
            ));
        }
    };

    // Gera tabela CET para um container
    const getCETTable = (container: BrandContainer) => {
        return Array.from({ length: 18 }, (_, i) => {
            const parcelas = i + 1;
            let mdr = container.credit1x;
            if (parcelas >= 2 && parcelas <= 6) mdr = container.credit2to6;
            if (parcelas >= 7 && parcelas <= 12) mdr = container.credit7to12;
            if (parcelas >= 13) mdr = container.credit13to18;
            return { parcelas, cet: calculateCET(mdr, parcelas) };
        });
    };

    const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

    // Exportar PDF
    const exportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const isSingleBrand = containers.length === 1;

        // Header - Centralizado e compacto
        doc.setFontSize(20);
        doc.setTextColor(0, 168, 104); // Stone green
        doc.text('CASA 94', pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text('Calculadora CET - Custo Efetivo Total', pageWidth / 2, 22, { align: 'center' });

        // Info linha
        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}  |  RAV: ${ravRate}%/mês  |  Fórmula: CET = 1 - ((100×(1-MDR))×(1-(RAV×média_meses)))/100`, pageWidth / 2, 30, { align: 'center' });

        let yPos = 40;

        if (isSingleBrand) {
            // Layout centralizado para uma bandeira
            const container = containers[0];
            const cetTable = getCETTable(container);

            // Nome da bandeira centralizado
            doc.setFontSize(16);
            doc.setTextColor(0, 168, 104);
            doc.text(container.name, pageWidth / 2, yPos, { align: 'center' });
            yPos += 7;

            // Taxas em uma linha
            doc.setFontSize(9);
            doc.setTextColor(80);
            doc.text(`Débito: ${container.debit}%  |  1x: ${container.credit1x}%  |  2-6x: ${container.credit2to6}%  |  7-12x: ${container.credit7to12}%  |  13-18x: ${container.credit13to18}%`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 10;

            // Tabela em 3 colunas (6 rows cada) - mais compacta
            const col1 = cetTable.slice(0, 6);
            const col2 = cetTable.slice(6, 12);
            const col3 = cetTable.slice(12, 18);

            const colWidth = 55;
            const startX = (pageWidth - colWidth * 3) / 2;

            autoTable(doc, {
                startY: yPos,
                head: [['Parcelas', 'CET', 'Parcelas', 'CET', 'Parcelas', 'CET']],
                body: col1.map((row, i) => [
                    `${row.parcelas}x`, `${row.cet.toFixed(2)}%`,
                    col2[i] ? `${col2[i].parcelas}x` : '', col2[i] ? `${col2[i].cet.toFixed(2)}%` : '',
                    col3[i] ? `${col3[i].parcelas}x` : '', col3[i] ? `${col3[i].cet.toFixed(2)}%` : '',
                ]),
                theme: 'grid',
                headStyles: { fillColor: [0, 168, 104], fontSize: 9, halign: 'center' },
                styles: { fontSize: 9, halign: 'center', cellPadding: 2 },
                columnStyles: {
                    0: { cellWidth: 22 }, 1: { cellWidth: 28 },
                    2: { cellWidth: 22 }, 3: { cellWidth: 28 },
                    4: { cellWidth: 22 }, 5: { cellWidth: 28 },
                },
                margin: { left: startX },
                tableWidth: 'wrap',
            });

        } else {
            // Layout com múltiplas bandeiras
            containers.forEach((container, index) => {
                const cetTable = getCETTable(container);

                if (yPos > 240) {
                    doc.addPage();
                    yPos = 20;
                }

                // Título da bandeira
                doc.setFontSize(12);
                doc.setTextColor(0, 168, 104);
                doc.text(container.name, 14, yPos);
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(`Débito: ${container.debit}% | 1x: ${container.credit1x}% | 2-6x: ${container.credit2to6}% | 7-12x: ${container.credit7to12}%`, 50, yPos);
                yPos += 5;

                // Tabela compacta em 2 colunas
                const col1 = cetTable.slice(0, 9);
                const col2 = cetTable.slice(9, 18);

                autoTable(doc, {
                    startY: yPos,
                    head: [['Parc.', 'CET', 'Parc.', 'CET']],
                    body: col1.map((row, i) => [
                        `${row.parcelas}x`, `${row.cet.toFixed(2)}%`,
                        col2[i] ? `${col2[i].parcelas}x` : '', col2[i] ? `${col2[i].cet.toFixed(2)}%` : '',
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [0, 168, 104], fontSize: 8 },
                    styles: { fontSize: 8, cellPadding: 1.5 },
                    columnStyles: {
                        0: { cellWidth: 18 }, 1: { cellWidth: 22 },
                        2: { cellWidth: 18 }, 3: { cellWidth: 22 },
                    },
                    margin: { left: 14 },
                    tableWidth: 'wrap',
                });

                yPos = (doc as any).lastAutoTable.finalY + 10;
            });
        }

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Gerado por Casa94 Stone - Simulador de Taxas', pageWidth / 2, pageHeight - 10, { align: 'center' });

        doc.save(`CET_${containers.map(c => c.name).join('_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Exportar Excel
    const exportExcel = () => {
        const wsData: (string | number)[][] = [
            ['CASA 94 - Calculador CET'],
            [''],
            ['Data:', new Date().toLocaleDateString('pt-BR')],
            ['RAV (Antecipação):', `${ravRate}%/mês`],
            ['Fórmula:', 'CET = MDR + (RAV × Parcelas)'],
            [''],
        ];

        containers.forEach((container) => {
            const cetTable = getCETTable(container);

            wsData.push([container.name]);
            wsData.push(['Débito:', `${container.debit}%`, 'Crédito 1x:', `${container.credit1x}%`]);
            wsData.push(['2-6x:', `${container.credit2to6}%`, '7-12x:', `${container.credit7to12}%`, '13-18x:', `${container.credit13to18}%`]);
            wsData.push(['']);
            wsData.push(['Parcelas', 'CET (%)']);
            cetTable.forEach(row => {
                wsData.push([`${row.parcelas}x`, `${row.cet.toFixed(2)}%`]);
            });
            wsData.push(['']);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'CET');
        XLSX.writeFile(wb, `CET_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Calculador de CET</h1>
                    <p className="text-slate-400 text-sm">CET = 1 - ((100 × (1 - MDR)) × (1 - (RAV × média_meses))) / 100</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">RAV (%/mês):</span>
                        <input
                            type="number"
                            step="0.01"
                            value={ravRate}
                            onChange={(e) => setRavRate(Number(e.target.value))}
                            className="w-24 bg-slate-800 border border-emerald-500/50 rounded-lg px-3 py-2 text-emerald-400 font-bold text-center"
                        />
                    </div>
                    <button
                        onClick={addContainer}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all"
                    >
                        + Bandeira
                    </button>
                    <button
                        onClick={exportPDF}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium rounded-xl transition-all flex items-center gap-2"
                    >
                        📄 PDF
                    </button>
                    <button
                        onClick={exportExcel}
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 font-medium rounded-xl transition-all flex items-center gap-2"
                    >
                        📊 Excel
                    </button>
                </div>
            </div>

            {/* Containers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {containers.map((container) => {
                    const cetTable = getCETTable(container);

                    return (
                        <div key={container.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                            {/* Header com seletor de bandeira */}
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 flex items-center justify-between">
                                <select
                                    value={container.name}
                                    onChange={(e) => applyPreset(container.id, e.target.value)}
                                    className="bg-white/20 border-0 text-white font-bold text-lg rounded-lg px-3 py-1 focus:ring-2 focus:ring-white/50"
                                >
                                    {DEFAULT_BRANDS.map(b => (
                                        <option key={b.name} value={b.name} className="text-slate-900">{b.name}</option>
                                    ))}
                                    <option value="OUTRA" className="text-slate-900">Outra...</option>
                                </select>
                                {containers.length > 1 && (
                                    <button
                                        onClick={() => removeContainer(container.id)}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Taxas MDR */}
                            <div className="p-4 space-y-3 border-b border-slate-800">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Débito</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={container.debit}
                                                onChange={(e) => updateContainer(container.id, 'debit', Number(e.target.value))}
                                                className={inputClass}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Crédito 1x</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={container.credit1x}
                                                onChange={(e) => updateContainer(container.id, 'credit1x', Number(e.target.value))}
                                                className={inputClass}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">2-6x</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={container.credit2to6}
                                                onChange={(e) => updateContainer(container.id, 'credit2to6', Number(e.target.value))}
                                                className={inputClass}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">7-12x</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={container.credit7to12}
                                                onChange={(e) => updateContainer(container.id, 'credit7to12', Number(e.target.value))}
                                                className={inputClass}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">13-18x</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={container.credit13to18}
                                                onChange={(e) => updateContainer(container.id, 'credit13to18', Number(e.target.value))}
                                                className={inputClass}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabela CET - 2 colunas */}
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-400 uppercase tracking-wider">Débito</span>
                                    <span className="text-sm font-bold text-emerald-400">{container.debit.toFixed(2)}%</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {/* Coluna 1: 1x-9x */}
                                    <div>
                                        <div className="grid grid-cols-2 border-b border-slate-700 pb-1 mb-1">
                                            <span className="text-slate-400">Parc.</span>
                                            <span className="text-slate-400 text-right">CET</span>
                                        </div>
                                        {cetTable.slice(0, 9).map((row) => (
                                            <div key={row.parcelas} className="grid grid-cols-2 py-0.5 border-b border-slate-800/30">
                                                <span className="text-white">{row.parcelas}x</span>
                                                <span className={`text-right font-medium ${row.cet < 5 ? 'text-emerald-400' : row.cet < 10 ? 'text-amber-400' : 'text-red-400'}`}>
                                                    {row.cet.toFixed(2)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Coluna 2: 10x-18x */}
                                    <div>
                                        <div className="grid grid-cols-2 border-b border-slate-700 pb-1 mb-1">
                                            <span className="text-slate-400">Parc.</span>
                                            <span className="text-slate-400 text-right">CET</span>
                                        </div>
                                        {cetTable.slice(9, 18).map((row) => (
                                            <div key={row.parcelas} className="grid grid-cols-2 py-0.5 border-b border-slate-800/30">
                                                <span className="text-white">{row.parcelas}x</span>
                                                <span className={`text-right font-medium ${row.cet < 5 ? 'text-emerald-400' : row.cet < 10 ? 'text-amber-400' : 'text-red-400'}`}>
                                                    {row.cet.toFixed(2)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legenda */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-medium text-white mb-3">📋 Legenda</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                        <span className="text-slate-400">CET &lt; 5%</span>
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                        <span className="text-slate-400">5% ≤ CET &lt; 10%</span>
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-400"></span>
                        <span className="text-slate-400">CET ≥ 10%</span>
                    </span>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                    Fórmula: CET = MDR + (RAV × Parcelas) | RAV atual: {ravRate}%/mês
                </p>
            </div>
        </div>
    );
}
