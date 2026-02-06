'use client';

import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Concorrentes
const COMPETITORS: Record<string, { color: string; debit: number; credit1x: number; credit2to6: number; credit7to12: number; credit13to18: number; rav: number; pix: number }> = {
    'Rede': { color: '#E53935', debit: 1.50, credit1x: 2.50, credit2to6: 3.00, credit7to12: 3.50, credit13to18: 3.99, rav: 1.50, pix: 1.00 },
    'Cielo': { color: '#1565C0', debit: 1.49, credit1x: 2.39, credit2to6: 2.99, credit7to12: 3.49, credit13to18: 3.99, rav: 1.49, pix: 0.99 },
    'PagSeguro': { color: '#F9A825', debit: 1.99, credit1x: 3.19, credit2to6: 3.99, credit7to12: 4.49, credit13to18: 4.99, rav: 1.99, pix: 0.00 },
    'Getnet': { color: '#E91E63', debit: 1.39, credit1x: 2.49, credit2to6: 3.19, credit7to12: 3.69, credit13to18: 4.19, rav: 1.39, pix: 0.99 },
    'Outro': { color: '#9E9E9E', debit: 2.00, credit1x: 3.00, credit2to6: 3.50, credit7to12: 4.00, credit13to18: 4.50, rav: 2.00, pix: 1.00 },
};

export default function PropostaPage() {
    // === Dados do Cliente ===
    const [clienteNome, setClienteNome] = useState('');
    const [clienteCNPJ, setClienteCNPJ] = useState('');

    // === Volume e Share ===
    const [volumeTotal, setVolumeTotal] = useState(100000);
    const [shares, setShares] = useState({ debit: 30, credit: 50, pix: 20 });

    // === Taxas Stone ===
    const [stone, setStone] = useState({
        debit: 0.84, credit1x: 1.86, credit2to6: 2.18, credit7to12: 2.41, credit13to18: 2.41, rav: 1.30, pix: 0.75
    });

    // === Taxas Concorrente ===
    const [competitorName, setCompetitorName] = useState('Rede');
    const [competitor, setCompetitor] = useState({
        debit: 1.50, credit1x: 2.50, credit2to6: 3.00, credit7to12: 3.50, credit13to18: 3.99, rav: 1.50, pix: 1.00
    });

    // === Máquinas Stone ===
    const [stoneQtdMaquinas, setStoneQtdMaquinas] = useState(1);
    const [stoneAluguel, setStoneAluguel] = useState(0);

    // === Máquinas Concorrente ===
    const [competitorQtdMaquinas, setCompetitorQtdMaquinas] = useState(1);
    const [competitorAluguel, setCompetitorAluguel] = useState(109);

    const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    // Cálculos
    const debitVolume = volumeTotal * shares.debit / 100;
    const creditVolume = volumeTotal * shares.credit / 100;
    const pixVolume = volumeTotal * shares.pix / 100;

    const stoneCosts = useMemo(() => ({
        debit: debitVolume * stone.debit / 100,
        credit: creditVolume * stone.credit1x / 100,
        pix: pixVolume * stone.pix / 100,
        total: 0, rent: stoneAluguel * stoneQtdMaquinas
    }), [debitVolume, creditVolume, pixVolume, stone, stoneAluguel, stoneQtdMaquinas]);
    stoneCosts.total = stoneCosts.debit + stoneCosts.credit + stoneCosts.pix + stoneCosts.rent;

    const competitorCosts = useMemo(() => ({
        debit: debitVolume * competitor.debit / 100,
        credit: creditVolume * competitor.credit1x / 100,
        pix: pixVolume * competitor.pix / 100,
        total: 0, rent: competitorAluguel * competitorQtdMaquinas
    }), [debitVolume, creditVolume, pixVolume, competitor, competitorAluguel, competitorQtdMaquinas]);
    competitorCosts.total = competitorCosts.debit + competitorCosts.credit + competitorCosts.pix + competitorCosts.rent;

    const economy = competitorCosts.total - stoneCosts.total;
    const economyPercent = competitorCosts.total > 0 ? (economy / competitorCosts.total) * 100 : 0;

    // Calcula isenção por volume
    const calcMaquinasIsentas = () => {
        if (volumeTotal >= 10000 && volumeTotal < 30000) return 1;
        if (volumeTotal >= 30000 && volumeTotal < 50000) return 2;
        if (volumeTotal >= 50000 && volumeTotal < 100000) return 4;
        if (volumeTotal >= 100000) return 4 + Math.floor((volumeTotal - 50000) / 50000) * 2;
        return 0;
    };
    const maquinasIsentas = calcMaquinasIsentas();

    // Atualiza concorrente
    const selectCompetitor = (name: string) => {
        setCompetitorName(name);
        if (COMPETITORS[name]) setCompetitor(COMPETITORS[name]);
    };

    // Calcular diferenças
    const diff = {
        debit: competitor.debit - stone.debit,
        credit1x: competitor.credit1x - stone.credit1x,
        credit2to6: competitor.credit2to6 - stone.credit2to6,
        credit7to12: competitor.credit7to12 - stone.credit7to12,
        credit13to18: competitor.credit13to18 - stone.credit13to18,
        rav: competitor.rav - stone.rav,
        pix: competitor.pix - stone.pix,
    };

    // === EXPORT PDF ===
    const exportPDF = () => {
        if (!clienteNome.trim()) {
            alert('Preencha o nome do cliente');
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Header verde Stone
        doc.setFillColor(0, 168, 104);
        doc.rect(0, 0, pageWidth, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('STONE', pageWidth / 2, 18, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('PROPOSTA COMERCIAL', pageWidth / 2, 28, { align: 'center' });
        doc.setFontSize(9);
        doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 15, 15, { align: 'right' });

        // Cliente
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(clienteNome, 15, 45);
        if (clienteCNPJ) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(`CNPJ/CPF: ${clienteCNPJ}`, 15, 51);
        }

        // Volume e Share
        let yPos = 60;
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`Volume Mensal: ${formatCurrency(volumeTotal)}`, 15, yPos);
        doc.text(`Débito: ${shares.debit}% | Crédito: ${shares.credit}% | PIX: ${shares.pix}%`, 100, yPos);
        yPos += 10;

        // Tabela comparativa de taxas
        autoTable(doc, {
            startY: yPos,
            margin: { left: 15 },
            tableWidth: pageWidth - 30,
            head: [['Taxa', 'Stone', competitorName, 'Diferença']],
            body: [
                ['Débito', `${stone.debit.toFixed(2)}%`, `${competitor.debit.toFixed(2)}%`, `+${diff.debit.toFixed(2)}%`],
                ['Crédito à vista', `${stone.credit1x.toFixed(2)}%`, `${competitor.credit1x.toFixed(2)}%`, `+${diff.credit1x.toFixed(2)}%`],
                ['Parcelado 2-6x', `${stone.credit2to6.toFixed(2)}%`, `${competitor.credit2to6.toFixed(2)}%`, `+${diff.credit2to6.toFixed(2)}%`],
                ['Parcelado 7-12x', `${stone.credit7to12.toFixed(2)}%`, `${competitor.credit7to12.toFixed(2)}%`, `+${diff.credit7to12.toFixed(2)}%`],
                ['Parcelado 13-18x', `${stone.credit13to18.toFixed(2)}%`, `${competitor.credit13to18.toFixed(2)}%`, `+${diff.credit13to18.toFixed(2)}%`],
                ['Antecipação (RAV)', `${stone.rav.toFixed(2)}%`, `${competitor.rav.toFixed(2)}%`, `+${diff.rav.toFixed(2)}%`],
                ['PIX', `${stone.pix.toFixed(2)}%`, `${competitor.pix.toFixed(2)}%`, `+${diff.pix.toFixed(2)}%`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [0, 168, 104], textColor: [255, 255, 255], fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { halign: 'center', fontStyle: 'bold' },
                2: { halign: 'center' },
                3: { halign: 'center', textColor: [0, 168, 104] }
            },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;

        // Máquinas
        autoTable(doc, {
            startY: yPos,
            margin: { left: 15 },
            tableWidth: 180,
            head: [['Máquinas', 'Stone', competitorName]],
            body: [
                ['Quantidade', stoneQtdMaquinas.toString(), competitorQtdMaquinas.toString()],
                ['Aluguel/mês', stoneAluguel === 0 ? 'ISENTO' : formatCurrency(stoneCosts.rent), formatCurrency(competitorCosts.rent)],
            ],
            theme: 'grid',
            headStyles: { fillColor: [100, 100, 100], fontSize: 9 },
            bodyStyles: { fontSize: 9 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;

        // Custos totais
        autoTable(doc, {
            startY: yPos,
            margin: { left: 15 },
            tableWidth: pageWidth - 30,
            head: [['Custos Mensais', 'Stone', competitorName, 'Economia']],
            body: [
                ['Taxas', formatCurrency(stoneCosts.debit + stoneCosts.credit + stoneCosts.pix), formatCurrency(competitorCosts.debit + competitorCosts.credit + competitorCosts.pix), ''],
                ['Aluguel Máquinas', formatCurrency(stoneCosts.rent), formatCurrency(competitorCosts.rent), ''],
                ['TOTAL', formatCurrency(stoneCosts.total), formatCurrency(competitorCosts.total), formatCurrency(economy)],
            ],
            theme: 'grid',
            headStyles: { fillColor: [0, 168, 104], fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            columnStyles: { 3: { textColor: [0, 168, 104], fontStyle: 'bold' } },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Economia destaque
        if (economy > 0) {
            doc.setFillColor(0, 168, 104);
            doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('ECONOMIA COM STONE', 25, yPos + 10);
            doc.setFontSize(18);
            doc.text(`${formatCurrency(economy)}/mês`, pageWidth / 2, yPos + 14, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`${formatCurrency(economy * 12)}/ano`, pageWidth / 2, yPos + 21, { align: 'center' });
            doc.text(`${economyPercent.toFixed(1)}% mais barato`, pageWidth - 25, yPos + 15, { align: 'right' });
        }

        // Rodapé
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('Proposta Stone - Válida por 30 dias', pageWidth - 15, pageHeight - 8, { align: 'right' });

        doc.save(`Proposta_${clienteNome.replace(/\s+/g, '_')}.pdf`);
    };

    // === EXPORT EXCEL ===
    const exportExcel = () => {
        if (!clienteNome.trim()) {
            alert('Preencha o nome do cliente');
            return;
        }

        const data = [
            ['STONE - PROPOSTA COMERCIAL'],
            [''],
            ['Cliente:', clienteNome],
            clienteCNPJ ? ['CNPJ/CPF:', clienteCNPJ] : [],
            ['Data:', new Date().toLocaleDateString('pt-BR')],
            ['Volume Mensal:', formatCurrency(volumeTotal)],
            ['Distribuição:', `Débito ${shares.debit}% | Crédito ${shares.credit}% | PIX ${shares.pix}%`],
            [''],
            ['TAXAS', 'Stone', competitorName, 'Diferença'],
            ['Débito', `${stone.debit}%`, `${competitor.debit}%`, `${diff.debit.toFixed(2)}%`],
            ['Crédito 1x', `${stone.credit1x}%`, `${competitor.credit1x}%`, `${diff.credit1x.toFixed(2)}%`],
            ['2-6x', `${stone.credit2to6}%`, `${competitor.credit2to6}%`, `${diff.credit2to6.toFixed(2)}%`],
            ['7-12x', `${stone.credit7to12}%`, `${competitor.credit7to12}%`, `${diff.credit7to12.toFixed(2)}%`],
            ['13-18x', `${stone.credit13to18}%`, `${competitor.credit13to18}%`, `${diff.credit13to18.toFixed(2)}%`],
            ['RAV', `${stone.rav}%`, `${competitor.rav}%`, `${diff.rav.toFixed(2)}%`],
            ['PIX', `${stone.pix}%`, `${competitor.pix}%`, `${diff.pix.toFixed(2)}%`],
            [''],
            ['MÁQUINAS', 'Stone', competitorName],
            ['Quantidade', stoneQtdMaquinas, competitorQtdMaquinas],
            ['Aluguel/mês', stoneAluguel === 0 ? 'ISENTO' : stoneCosts.rent, competitorCosts.rent],
            [''],
            ['CUSTOS', 'Stone', competitorName],
            ['Taxas', stoneCosts.debit + stoneCosts.credit + stoneCosts.pix, competitorCosts.debit + competitorCosts.credit + competitorCosts.pix],
            ['Aluguel', stoneCosts.rent, competitorCosts.rent],
            ['TOTAL', stoneCosts.total, competitorCosts.total],
            [''],
            ['ECONOMIA MENSAL', formatCurrency(economy)],
            ['ECONOMIA ANUAL', formatCurrency(economy * 12)],
        ].filter(r => r.length > 0);

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Proposta');
        XLSX.writeFile(wb, `Proposta_${clienteNome.replace(/\s+/g, '_')}.xlsx`);
    };

    const inputClass = "w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00A868]/50 focus:ring-1 focus:ring-[#00A868]/30 transition-all";

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Nova Proposta</h1>
                    <p className="text-slate-400 text-sm">Preencha todos os dados e gere a proposta completa</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportPDF} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg flex items-center gap-2">
                        📄 PDF
                    </button>
                    <button onClick={exportExcel} className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm rounded-lg flex items-center gap-2">
                        📊 Excel
                    </button>
                </div>
            </div>

            {/* Cliente + Volume */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Dados do Cliente */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                    <h2 className="text-white font-semibold text-sm mb-3">👤 Dados do Cliente</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Nome / Razão Social *</label>
                            <input type="text" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)}
                                placeholder="Nome completo" className={inputClass} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">CNPJ / CPF</label>
                            <input type="text" value={clienteCNPJ} onChange={(e) => setClienteCNPJ(e.target.value)}
                                placeholder="00.000.000/0000-00" className={inputClass} />
                        </div>
                    </div>
                </div>

                {/* Volume e Share */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                    <h2 className="text-white font-semibold text-sm mb-3">💰 Volume Mensal (TPV)</h2>
                    <div className="grid grid-cols-4 gap-3">
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Volume Total</label>
                            <input type="number" value={volumeTotal} onChange={(e) => setVolumeTotal(Number(e.target.value))}
                                className={inputClass + " text-[#00A868] font-bold"} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Débito %</label>
                            <input type="number" value={shares.debit} onChange={(e) => setShares({ ...shares, debit: Number(e.target.value) })}
                                className={inputClass + " text-center"} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Crédito %</label>
                            <input type="number" value={shares.credit} onChange={(e) => setShares({ ...shares, credit: Number(e.target.value) })}
                                className={inputClass + " text-center"} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">PIX %</label>
                            <input type="number" value={shares.pix} onChange={(e) => setShares({ ...shares, pix: Number(e.target.value) })}
                                className={inputClass + " text-center"} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Taxas Comparativas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Stone */}
                <div className="bg-slate-900/50 border border-[#00A868]/40 rounded-xl overflow-hidden">
                    <div className="bg-[#00A868]/20 px-4 py-2 border-b border-[#00A868]/30">
                        <span className="text-[#00A868] font-bold">Stone</span>
                    </div>
                    <div className="p-4 space-y-2">
                        {[
                            { label: 'Débito', key: 'debit' },
                            { label: 'Crédito 1x', key: 'credit1x' },
                            { label: '2-6x', key: 'credit2to6' },
                            { label: '7-12x', key: 'credit7to12' },
                            { label: '13-18x', key: 'credit13to18' },
                            { label: 'RAV', key: 'rav' },
                            { label: 'PIX', key: 'pix' },
                        ].map(({ label, key }) => (
                            <div key={key} className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">{label}</span>
                                <input type="number" step="0.01" value={stone[key as keyof typeof stone]}
                                    onChange={(e) => setStone({ ...stone, [key]: Number(e.target.value) })}
                                    className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[#00A868] text-xs text-center font-bold" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Concorrente */}
                <div className="bg-slate-900/50 border border-red-500/40 rounded-xl overflow-hidden">
                    <div className="bg-red-500/20 px-4 py-2 border-b border-red-500/30 flex items-center justify-between">
                        <select value={competitorName} onChange={(e) => selectCompetitor(e.target.value)}
                            className="bg-transparent text-red-400 font-bold text-sm border-0 focus:ring-0">
                            {Object.keys(COMPETITORS).map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                        </select>
                    </div>
                    <div className="p-4 space-y-2">
                        {[
                            { label: 'Débito', key: 'debit' },
                            { label: 'Crédito 1x', key: 'credit1x' },
                            { label: '2-6x', key: 'credit2to6' },
                            { label: '7-12x', key: 'credit7to12' },
                            { label: '13-18x', key: 'credit13to18' },
                            { label: 'RAV', key: 'rav' },
                            { label: 'PIX', key: 'pix' },
                        ].map(({ label, key }) => (
                            <div key={key} className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">{label}</span>
                                <input type="number" step="0.01" value={competitor[key as keyof typeof competitor]}
                                    onChange={(e) => setCompetitor({ ...competitor, [key]: Number(e.target.value) })}
                                    className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-red-400 text-xs text-center font-bold" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Diferença */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700">
                        <span className="text-white font-bold">Diferença</span>
                    </div>
                    <div className="p-4 space-y-2">
                        {[
                            { label: 'Débito', value: diff.debit },
                            { label: 'Crédito 1x', value: diff.credit1x },
                            { label: '2-6x', value: diff.credit2to6 },
                            { label: '7-12x', value: diff.credit7to12 },
                            { label: '13-18x', value: diff.credit13to18 },
                            { label: 'RAV', value: diff.rav },
                            { label: 'PIX', value: diff.pix },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">{label}</span>
                                <span className={`text-xs font-bold ${value > 0 ? 'text-[#00A868]' : 'text-red-400'}`}>
                                    {value > 0 ? '+' : ''}{value.toFixed(2)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Máquinas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Stone */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00A868]/20 via-slate-900/80 to-slate-900/90 border border-[#00A868]/40 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[#00A868] font-bold">🖥️ Máquinas Stone</span>
                        {maquinasIsentas > 0 && (
                            <button onClick={() => { setStoneQtdMaquinas(maquinasIsentas); setStoneAluguel(0); }}
                                className="px-3 py-1 bg-[#00A868]/30 hover:bg-[#00A868]/50 border border-[#00A868]/50 rounded-lg text-[10px] text-[#00A868] font-medium">
                                ⚡ Isenção ({maquinasIsentas} máq.)
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Quantidade</label>
                            <input type="number" min="1" value={stoneQtdMaquinas} onChange={(e) => setStoneQtdMaquinas(Number(e.target.value))}
                                className={inputClass + " text-center"} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Aluguel/mês</label>
                            <input type="number" step="0.01" value={stoneAluguel} onChange={(e) => setStoneAluguel(Number(e.target.value))}
                                className={inputClass + " text-center text-[#00A868]"} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Total:</span>
                        <div className="flex items-center gap-2">
                            {stoneAluguel === 0 && <span className="px-2 py-0.5 bg-[#00A868]/20 text-[#00A868] text-[10px] rounded-full">ISENTO</span>}
                            <span className="text-lg font-bold text-[#00A868]">{formatCurrency(stoneCosts.rent)}</span>
                        </div>
                    </div>
                </div>

                {/* Concorrente */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-slate-900/80 to-slate-900/90 border border-red-500/40 p-4">
                    <span className="text-red-400 font-bold mb-3 block">🖥️ Máquinas {competitorName}</span>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Quantidade</label>
                            <input type="number" min="1" value={competitorQtdMaquinas} onChange={(e) => setCompetitorQtdMaquinas(Number(e.target.value))}
                                className={inputClass + " text-center"} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Aluguel/mês</label>
                            <input type="number" step="0.01" value={competitorAluguel} onChange={(e) => setCompetitorAluguel(Number(e.target.value))}
                                className={inputClass + " text-center text-red-400"} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Total:</span>
                        <span className="text-lg font-bold text-red-400">{formatCurrency(competitorCosts.rent)}</span>
                    </div>
                </div>
            </div>

            {/* Resumo Final */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-[#00A868]/10 border border-[#00A868]/30 rounded-xl p-4 text-center">
                    <span className="text-xs text-slate-400 block mb-1">💚 Custo Stone</span>
                    <span className="text-sm text-slate-500 block">Taxas: {formatCurrency(stoneCosts.debit + stoneCosts.credit + stoneCosts.pix)}</span>
                    <span className="text-sm text-slate-500 block">Aluguel: {formatCurrency(stoneCosts.rent)}</span>
                    <span className="text-2xl font-bold text-[#00A868]">{formatCurrency(stoneCosts.total)}</span>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                    <span className="text-xs text-slate-400 block mb-1">❤️ Custo {competitorName}</span>
                    <span className="text-sm text-slate-500 block">Taxas: {formatCurrency(competitorCosts.debit + competitorCosts.credit + competitorCosts.pix)}</span>
                    <span className="text-sm text-slate-500 block">Aluguel: {formatCurrency(competitorCosts.rent)}</span>
                    <span className="text-2xl font-bold text-red-400">{formatCurrency(competitorCosts.total)}</span>
                </div>
                <div className={`rounded-xl p-4 text-center ${economy > 0 ? 'bg-[#00A868]/20 border border-[#00A868]' : 'bg-amber-500/20 border border-amber-500'}`}>
                    <span className="text-xs text-slate-400 block mb-1">💰 Economia Mensal</span>
                    <span className={`text-3xl font-bold ${economy > 0 ? 'text-[#00A868]' : 'text-amber-400'}`}>
                        {economy > 0 ? '+' : ''}{formatCurrency(economy)}
                    </span>
                    <span className="text-sm text-slate-400 block">{economyPercent.toFixed(1)}% mais barato</span>
                </div>
            </div>
        </div>
    );
}
