'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Logos das empresas
const LOGOS = {
    stone: '/logos/Stone_pagamentos.png',
    rede: '/logos/rede itau.png',
    cielo: '/logos/logo-cielo-512.png',
    pagseguro: '/logos/pagseguro.png',
    mercadopago: '/logos/logo-mercado-pago-512.png',
    ton: '/logos/ton.png',
    sumup: '/logos/sumup.png',
    infinitypay: '/logos/infinitypay.svg',
    c6: '/logos/logo-c6-bank-512.png',
    visa: '/logos/visa.png',
    master: '/logos/master.png',
    elo: '/logos/elo.png',
    amex: '/logos/americanexpress.png',
};

// Concorrentes com logos
const COMPETITORS: Record<string, { color: string; logo: string; debit: number; credit1x: number; credit2to6: number; credit7to12: number; credit13to18: number; rav: number; pix: number }> = {
    'Rede': { color: '#E53935', logo: LOGOS.rede, debit: 1.50, credit1x: 2.50, credit2to6: 3.00, credit7to12: 3.50, credit13to18: 3.99, rav: 1.50, pix: 1.00 },
    'Cielo': { color: '#1565C0', logo: LOGOS.cielo, debit: 1.49, credit1x: 2.39, credit2to6: 2.99, credit7to12: 3.49, credit13to18: 3.99, rav: 1.49, pix: 0.99 },
    'PagSeguro': { color: '#F9A825', logo: LOGOS.pagseguro, debit: 1.99, credit1x: 3.19, credit2to6: 3.99, credit7to12: 4.49, credit13to18: 4.99, rav: 1.99, pix: 0.00 },
    'Mercado Pago': { color: '#009EE3', logo: LOGOS.mercadopago, debit: 1.89, credit1x: 2.99, credit2to6: 3.79, credit7to12: 4.29, credit13to18: 4.79, rav: 1.89, pix: 0.00 },
    'Ton': { color: '#00B900', logo: LOGOS.ton, debit: 1.69, credit1x: 2.79, credit2to6: 3.49, credit7to12: 3.99, credit13to18: 4.49, rav: 1.69, pix: 0.00 },
    'SumUp': { color: '#1E3F66', logo: LOGOS.sumup, debit: 1.59, credit1x: 2.69, credit2to6: 3.29, credit7to12: 3.79, credit13to18: 4.29, rav: 1.59, pix: 0.00 },
    'InfinityPay': { color: '#6B5CE7', logo: LOGOS.infinitypay, debit: 0.99, credit1x: 2.49, credit2to6: 3.19, credit7to12: 3.69, credit13to18: 4.19, rav: 1.49, pix: 0.00 },
    'C6 Bank': { color: '#1A1A1A', logo: LOGOS.c6, debit: 1.29, credit1x: 2.39, credit2to6: 2.99, credit7to12: 3.49, credit13to18: 3.99, rav: 1.29, pix: 0.00 },
    'Outro': { color: '#9E9E9E', logo: '', debit: 2.00, credit1x: 3.00, credit2to6: 3.50, credit7to12: 4.00, credit13to18: 4.50, rav: 2.00, pix: 1.00 },
};

export default function PropostaPage() {
    // === Dados do Cliente ===
    const [clienteNome, setClienteNome] = useState('');
    const [clienteCNPJ, setClienteCNPJ] = useState('');

    // === Volume e Share ===
    const [volumeTotal, setVolumeTotal] = useState(100000);
    const [shares, setShares] = useState({ debit: 30, credit: 50, pix: 20 });

    // === Bandeira de Cartão ===
    const [cardBrand, setCardBrand] = useState<'VISA/MASTER' | 'ELO' | 'AMEX' | 'HIPERCARD' | 'CABAL'>('VISA/MASTER');

    // Taxas por bandeira
    const BRAND_RATES = {
        'VISA/MASTER': { debit: 0.84, credit1x: 1.86, credit2to6: 2.18, credit7to12: 2.41, credit13to18: 2.41 },
        'ELO': { debit: 1.83, credit1x: 2.82, credit2to6: 3.28, credit7to12: 3.76, credit13to18: 3.76 },
        'AMEX': { debit: 2.50, credit1x: 3.50, credit2to6: 4.00, credit7to12: 4.50, credit13to18: 4.50 },
        'HIPERCARD': { debit: 1.90, credit1x: 2.90, credit2to6: 3.40, credit7to12: 3.90, credit13to18: 3.90 },
        'CABAL': { debit: 1.80, credit1x: 2.80, credit2to6: 3.30, credit7to12: 3.80, credit13to18: 3.80 },
    };

    // === Taxas Stone (vem da bandeira selecionada) ===
    const [stone, setStone] = useState({
        debit: 0.84, credit1x: 1.86, credit2to6: 2.18, credit7to12: 2.41, credit13to18: 2.41, rav: 1.30, pix: 0.75
    });

    // Atualizar taxas quando mudar bandeira
    const selectBrand = (brand: typeof cardBrand) => {
        setCardBrand(brand);
        const rates = BRAND_RATES[brand];
        setStone(prev => ({ ...prev, ...rates }));
    };

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

    const stoneCosts = useMemo(() => {
        const debit = debitVolume * stone.debit / 100;
        const credit = creditVolume * stone.credit1x / 100;
        const pix = pixVolume * stone.pix / 100;
        const rent = stoneAluguel * stoneQtdMaquinas;
        return { debit, credit, pix, rent, total: debit + credit + pix + rent };
    }, [debitVolume, creditVolume, pixVolume, stone, stoneAluguel, stoneQtdMaquinas]);

    const competitorCosts = useMemo(() => {
        const debit = debitVolume * competitor.debit / 100;
        const credit = creditVolume * competitor.credit1x / 100;
        const pix = pixVolume * competitor.pix / 100;
        const rent = competitorAluguel * competitorQtdMaquinas;
        return { debit, credit, pix, rent, total: debit + credit + pix + rent };
    }, [debitVolume, creditVolume, pixVolume, competitor, competitorAluguel, competitorQtdMaquinas]);

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
        const c = COMPETITORS[name];
        if (c) setCompetitor({ debit: c.debit, credit1x: c.credit1x, credit2to6: c.credit2to6, credit7to12: c.credit7to12, credit13to18: c.credit13to18, rav: c.rav, pix: c.pix });
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

    // CET Calculator - inclui RAV e PIX
    const calculateCET = (mdr: number, parcelas: number) => {
        const avgMonths = (1 + parcelas) / 2;
        const ravCost = stone.rav / 100 * avgMonths;
        const pixCost = stone.pix / 100;
        return ((mdr / 100) + ravCost) * 100;
    };

    // Gerar tabela CET 1x-18x
    const getCETTable = () => {
        const rates = [
            { parcelas: 1, mdr: stone.credit1x },
            { parcelas: 2, mdr: stone.credit2to6 },
            { parcelas: 3, mdr: stone.credit2to6 },
            { parcelas: 4, mdr: stone.credit2to6 },
            { parcelas: 5, mdr: stone.credit2to6 },
            { parcelas: 6, mdr: stone.credit2to6 },
            { parcelas: 7, mdr: stone.credit7to12 },
            { parcelas: 8, mdr: stone.credit7to12 },
            { parcelas: 9, mdr: stone.credit7to12 },
            { parcelas: 10, mdr: stone.credit7to12 },
            { parcelas: 11, mdr: stone.credit7to12 },
            { parcelas: 12, mdr: stone.credit7to12 },
            { parcelas: 13, mdr: stone.credit13to18 },
            { parcelas: 14, mdr: stone.credit13to18 },
            { parcelas: 15, mdr: stone.credit13to18 },
            { parcelas: 16, mdr: stone.credit13to18 },
            { parcelas: 17, mdr: stone.credit13to18 },
            { parcelas: 18, mdr: stone.credit13to18 },
        ];
        return rates.map(r => {
            const avgMonths = (1 + r.parcelas) / 2;
            const cet = r.mdr + (stone.rav * avgMonths);
            return { parcelas: r.parcelas, cet: cet.toFixed(2) };
        });
    };

    // === EXPORT PDF ===
    const exportPDF = () => {
        if (!clienteNome.trim()) { alert('Preencha o nome do cliente'); return; }

        const doc = new jsPDF({ orientation: 'landscape' });
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header verde Stone
        doc.setFillColor(0, 168, 104);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(32);
        doc.setFont('helvetica', 'bold');
        doc.text('STONE', pageWidth / 2, 18, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('PROPOSTA DE TAXAS', pageWidth / 2, 28, { align: 'center' });
        doc.setFontSize(9);
        doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 15, 15, { align: 'right' });

        // Nome da empresa GRANDE e centralizado
        let yPos = 50;
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(clienteNome.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        if (clienteCNPJ) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80, 80, 80);
            doc.text(clienteCNPJ, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
        }

        // Bandeira do cartão - Taxas horizontais
        yPos += 6;
        doc.setTextColor(0, 168, 104);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(cardBrand, 15, yPos);
        yPos += 4;

        autoTable(doc, {
            startY: yPos, margin: { left: 15 }, tableWidth: 180,
            head: [['Débito', 'Crédito 1x', '2-6x', '7-12x', '13-18x']],
            body: [[
                `${stone.debit.toFixed(2)}%`,
                `${stone.credit1x.toFixed(2)}%`,
                `${stone.credit2to6.toFixed(2)}%`,
                `${stone.credit7to12.toFixed(2)}%`,
                `${stone.credit13to18.toFixed(2)}%`,
            ]],
            theme: 'grid',
            headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 10, fontStyle: 'bold', halign: 'center' },
        });
        yPos = (doc as any).lastAutoTable.finalY + 6;

        // Tabela CET (1x-18x em 3 colunas)
        const cetData = getCETTable();
        autoTable(doc, {
            startY: yPos, margin: { left: 15 }, tableWidth: pageWidth - 30,
            head: [['Parcelas', 'CET', 'Parcelas', 'CET', 'Parcelas', 'CET']],
            body: [
                [`1x`, `${cetData[0].cet}%`, `7x`, `${cetData[6].cet}%`, `13x`, `${cetData[12].cet}%`],
                [`2x`, `${cetData[1].cet}%`, `8x`, `${cetData[7].cet}%`, `14x`, `${cetData[13].cet}%`],
                [`3x`, `${cetData[2].cet}%`, `9x`, `${cetData[8].cet}%`, `15x`, `${cetData[14].cet}%`],
                [`4x`, `${cetData[3].cet}%`, `10x`, `${cetData[9].cet}%`, `16x`, `${cetData[15].cet}%`],
                [`5x`, `${cetData[4].cet}%`, `11x`, `${cetData[10].cet}%`, `17x`, `${cetData[16].cet}%`],
                [`6x`, `${cetData[5].cet}%`, `12x`, `${cetData[11].cet}%`, `18x`, `${cetData[17].cet}%`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [0, 168, 104], textColor: [255, 255, 255], fontSize: 8 },
            bodyStyles: { fontSize: 9, halign: 'center' },
            columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' }, 4: { fontStyle: 'bold' } },
        });
        yPos = (doc as any).lastAutoTable.finalY + 6;

        // RAV e PIX
        autoTable(doc, {
            startY: yPos, margin: { left: 15 }, tableWidth: 120,
            body: [
                ['Antecipação (RAV)', `${stone.rav.toFixed(2)}%/mês`],
                ['PIX', `${stone.pix.toFixed(2)}%`],
            ],
            theme: 'plain',
            bodyStyles: { fontSize: 9 },
            columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right', textColor: [0, 168, 104] } },
        });
        yPos = (doc as any).lastAutoTable.finalY + 6;

        // Adesão e Mensalidade
        autoTable(doc, {
            startY: yPos, margin: { left: 15 }, tableWidth: 150,
            body: [
                ['Taxa de Adesão', 'R$ 478,80'],
                ['Mensalidade', stoneAluguel === 0 ? 'ISENTO' : formatCurrency(stoneAluguel)],
            ],
            theme: 'plain',
            bodyStyles: { fontSize: 9 },
            columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
        });
        yPos = (doc as any).lastAutoTable.finalY + 6;

        // Meta isenção
        if (maquinasIsentas > 0) {
            doc.setFontSize(8);
            doc.setTextColor(80, 80, 80);
            doc.text(`Bater a Meta ${formatCurrency(volumeTotal)}+ acordada na proposta, isenta a Mensalidade de até ${maquinasIsentas} Máquinas durante todo período de metas batidas`, 15, yPos);
        }

        doc.save(`Proposta_${clienteNome.replace(/\s+/g, '_')}.pdf`);
    };

    // === EXPORT EXCEL ===
    const exportExcel = () => {
        if (!clienteNome.trim()) { alert('Preencha o nome do cliente'); return; }
        const data = [
            ['STONE - PROPOSTA COMERCIAL'], [''], ['Cliente:', clienteNome],
            clienteCNPJ ? ['CNPJ/CPF:', clienteCNPJ] : [], ['Data:', new Date().toLocaleDateString('pt-BR')],
            ['Volume Mensal:', formatCurrency(volumeTotal)], [''], ['TAXAS', 'Stone', competitorName, 'Diferença'],
            ['Débito', `${stone.debit}%`, `${competitor.debit}%`, `${diff.debit.toFixed(2)}%`],
            ['Crédito 1x', `${stone.credit1x}%`, `${competitor.credit1x}%`, `${diff.credit1x.toFixed(2)}%`],
            ['2-6x', `${stone.credit2to6}%`, `${competitor.credit2to6}%`, `${diff.credit2to6.toFixed(2)}%`],
            ['7-12x', `${stone.credit7to12}%`, `${competitor.credit7to12}%`, `${diff.credit7to12.toFixed(2)}%`],
            ['RAV', `${stone.rav}%`, `${competitor.rav}%`, `${diff.rav.toFixed(2)}%`],
            ['PIX', `${stone.pix}%`, `${competitor.pix}%`, `${diff.pix.toFixed(2)}%`],
            [''], ['MÁQUINAS', 'Stone', competitorName],
            ['Quantidade', stoneQtdMaquinas, competitorQtdMaquinas],
            ['Aluguel/mês', stoneAluguel === 0 ? 'ISENTO' : stoneCosts.rent, competitorCosts.rent],
            [''], ['ECONOMIA MENSAL', formatCurrency(economy)], ['ECONOMIA ANUAL', formatCurrency(economy * 12)],
        ].filter(r => r.length > 0);
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Proposta');
        XLSX.writeFile(wb, `Proposta_${clienteNome.replace(/\s+/g, '_')}.xlsx`);
    };

    // === SHARE WHATSAPP ===
    const shareWhatsApp = () => {
        if (!clienteNome.trim()) { alert('Preencha o nome do cliente'); return; }
        const text = `🟢 PROPOSTA STONE - ${clienteNome}

💰 Volume: ${formatCurrency(volumeTotal)}/mês
📊 Share: Débito ${shares.debit}% | Crédito ${shares.credit}% | PIX ${shares.pix}%

📈 TAXAS STONE:
• Débito: ${stone.debit}%
• Crédito 1x: ${stone.credit1x}%
• Parcelado 2-6x: ${stone.credit2to6}%
• Parcelado 7-12x: ${stone.credit7to12}%
• RAV: ${stone.rav}%
• PIX: ${stone.pix}%

🖥️ Máquinas: ${stoneQtdMaquinas}x ${stoneAluguel === 0 ? '(ISENTO)' : formatCurrency(stoneAluguel) + '/mês'}

💚 ECONOMIA: ${formatCurrency(economy)}/mês = ${formatCurrency(economy * 12)}/ano
📉 ${economyPercent.toFixed(1)}% mais barato que ${competitorName}

✅ Proposta válida por 30 dias`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const inputClass = "w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00A868]/50 focus:ring-1 focus:ring-[#00A868]/30 transition-all";

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Nova Proposta Completa</h1>
                    <p className="text-slate-400 text-sm">CET + Comparação + Máquinas - Tudo em um só lugar</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={shareWhatsApp} className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-sm rounded-lg flex items-center gap-2 border border-green-600/30">📱 WhatsApp</button>
                    <button onClick={exportPDF} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg flex items-center gap-2">📄 PDF</button>
                    <button onClick={exportExcel} className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm rounded-lg flex items-center gap-2">📊 Excel</button>
                </div>
            </div>

            {/* Cliente + Volume */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                    <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">👤 Dados do Cliente</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Nome / Razão Social *</label>
                            <input type="text" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome completo" className={inputClass} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">CNPJ / CPF</label>
                            <input type="text" value={clienteCNPJ} onChange={(e) => setClienteCNPJ(e.target.value)} placeholder="00.000.000/0000-00" className={inputClass} />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                    <h2 className="text-white font-semibold text-sm mb-3">💰 Volume Mensal (TPV)</h2>
                    <div className="grid grid-cols-4 gap-3">
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Volume Total</label>
                            <input type="number" value={volumeTotal} onChange={(e) => setVolumeTotal(Number(e.target.value))} className={inputClass + " text-[#00A868] font-bold"} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Débito %</label>
                            <input type="number" value={shares.debit} onChange={(e) => setShares({ ...shares, debit: Number(e.target.value) })} className={inputClass + " text-center"} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Crédito %</label>
                            <input type="number" value={shares.credit} onChange={(e) => setShares({ ...shares, credit: Number(e.target.value) })} className={inputClass + " text-center"} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1">PIX %</label>
                            <input type="number" value={shares.pix} onChange={(e) => setShares({ ...shares, pix: Number(e.target.value) })} className={inputClass + " text-center"} />
                        </div>
                    </div>
                </div>
            </div>

            {/* CET Stone - 3 colunas de parcelas */}
            <div className="bg-slate-900/50 border border-[#00A868]/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Image src={LOGOS.stone} alt="Stone" width={80} height={24} className="object-contain" />
                        <h2 className="text-[#00A868] font-bold text-sm">CET Stone</h2>
                        <select
                            value={cardBrand}
                            onChange={(e) => selectBrand(e.target.value as typeof cardBrand)}
                            className="bg-[#00A868] text-white font-bold text-xs px-3 py-1.5 rounded-lg border-0 cursor-pointer"
                        >
                            <option value="VISA/MASTER">VISA/MASTER</option>
                            <option value="ELO">ELO</option>
                            <option value="AMEX">AMEX</option>
                            <option value="HIPERCARD">HIPERCARD</option>
                            <option value="CABAL">CABAL</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        {cardBrand === 'VISA/MASTER' && (
                            <>
                                <Image src={LOGOS.visa} alt="Visa" width={40} height={24} className="object-contain" />
                                <Image src={LOGOS.master} alt="Master" width={40} height={24} className="object-contain" />
                            </>
                        )}
                        {cardBrand === 'ELO' && <Image src={LOGOS.elo} alt="Elo" width={50} height={24} className="object-contain" />}
                        {cardBrand === 'AMEX' && <Image src={LOGOS.amex} alt="Amex" width={50} height={24} className="object-contain" />}
                    </div>
                </div>
                <div className="grid grid-cols-6 gap-2 text-center mb-2">
                    <span className="text-xs text-slate-400">Parc.</span><span className="text-xs text-[#00A868] font-bold">CET</span>
                    <span className="text-xs text-slate-400">Parc.</span><span className="text-xs text-[#00A868] font-bold">CET</span>
                    <span className="text-xs text-slate-400">Parc.</span><span className="text-xs text-[#00A868] font-bold">CET</span>
                </div>
                <div className="grid grid-cols-6 gap-2 text-center">
                    {[1, 2, 3, 4, 5, 6].map(i => {
                        const mdr = i === 1 ? stone.credit1x : stone.credit2to6;
                        return (<><span key={`p${i}`} className="text-xs text-white">{i}x</span><span key={`c${i}`} className="text-xs text-[#00A868] font-bold">{calculateCET(mdr, i).toFixed(2)}%</span></>);
                    })}
                </div>
                <div className="grid grid-cols-6 gap-2 text-center mt-1">
                    {[7, 8, 9, 10, 11, 12].map(i => {
                        const mdr = stone.credit7to12;
                        return (<><span key={`p${i}`} className="text-xs text-white">{i}x</span><span key={`c${i}`} className="text-xs text-[#00A868] font-bold">{calculateCET(mdr, i).toFixed(2)}%</span></>);
                    })}
                </div>
            </div>

            {/* Taxas Comparativas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Stone */}
                <div className="bg-slate-900/50 border border-[#00A868]/40 rounded-xl overflow-hidden">
                    <div className="bg-[#00A868]/20 px-4 py-2 border-b border-[#00A868]/30 flex items-center gap-2">
                        <Image src={LOGOS.stone} alt="Stone" width={60} height={20} className="object-contain" />
                    </div>
                    <div className="p-4 space-y-2">
                        {[{ label: 'Débito', k: 'debit' }, { label: 'Crédito 1x', k: 'credit1x' }, { label: '2-6x', k: 'credit2to6' }, { label: '7-12x', k: 'credit7to12' }, { label: '13-18x', k: 'credit13to18' }, { label: 'RAV', k: 'rav' }, { label: 'PIX', k: 'pix' }].map(({ label, k }) => (
                            <div key={k} className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">{label}</span>
                                <input type="number" step="0.01" value={stone[k as keyof typeof stone]} onChange={(e) => setStone({ ...stone, [k]: Number(e.target.value) })}
                                    className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[#00A868] text-xs text-center font-bold" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Concorrente */}
                <div className="bg-slate-900/50 border border-red-500/40 rounded-xl overflow-hidden">
                    <div className="bg-red-500/20 px-4 py-2 border-b border-red-500/30 flex items-center gap-3">
                        {COMPETITORS[competitorName]?.logo && <Image src={COMPETITORS[competitorName].logo} alt={competitorName} width={50} height={20} className="object-contain" />}
                        <select value={competitorName} onChange={(e) => selectCompetitor(e.target.value)} className="bg-transparent text-red-400 font-bold text-sm border-0 focus:ring-0 flex-1">
                            {Object.keys(COMPETITORS).map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                        </select>
                    </div>
                    <div className="p-4 space-y-2">
                        {[{ label: 'Débito', k: 'debit' }, { label: 'Crédito 1x', k: 'credit1x' }, { label: '2-6x', k: 'credit2to6' }, { label: '7-12x', k: 'credit7to12' }, { label: '13-18x', k: 'credit13to18' }, { label: 'RAV', k: 'rav' }, { label: 'PIX', k: 'pix' }].map(({ label, k }) => (
                            <div key={k} className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">{label}</span>
                                <input type="number" step="0.01" value={competitor[k as keyof typeof competitor]} onChange={(e) => setCompetitor({ ...competitor, [k]: Number(e.target.value) })}
                                    className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-red-400 text-xs text-center font-bold" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Diferença */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700"><span className="text-white font-bold">Diferença</span></div>
                    <div className="p-4 space-y-2">
                        {[{ label: 'Débito', v: diff.debit }, { label: 'Crédito 1x', v: diff.credit1x }, { label: '2-6x', v: diff.credit2to6 }, { label: '7-12x', v: diff.credit7to12 }, { label: '13-18x', v: diff.credit13to18 }, { label: 'RAV', v: diff.rav }, { label: 'PIX', v: diff.pix }].map(({ label, v }) => (
                            <div key={label} className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">{label}</span>
                                <span className={`text-xs font-bold ${v > 0 ? 'text-[#00A868]' : 'text-red-400'}`}>{v > 0 ? '+' : ''}{v.toFixed(2)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Máquinas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-[#00A868]/10 border border-[#00A868]/40 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[#00A868] font-bold">🖥️ Máquinas Stone</span>
                        {maquinasIsentas > 0 && (
                            <button onClick={() => { setStoneQtdMaquinas(maquinasIsentas); setStoneAluguel(0); }}
                                className="px-3 py-1 bg-[#00A868]/30 hover:bg-[#00A868]/50 border border-[#00A868] rounded-lg text-[10px] text-[#00A868] font-medium">
                                ⚡ Isenção ({maquinasIsentas} máq.)
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] text-slate-500 block mb-1">Quantidade</label><input type="number" min="1" value={stoneQtdMaquinas} onChange={(e) => setStoneQtdMaquinas(Number(e.target.value))} className={inputClass + " text-center"} /></div>
                        <div><label className="text-[10px] text-slate-500 block mb-1">Aluguel/mês</label><input type="number" step="0.01" value={stoneAluguel} onChange={(e) => setStoneAluguel(Number(e.target.value))} className={inputClass + " text-center text-[#00A868]"} /></div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Total:</span>
                        <div className="flex items-center gap-2">
                            {stoneAluguel === 0 && <span className="px-2 py-0.5 bg-[#00A868]/20 text-[#00A868] text-[10px] rounded-full">ISENTO</span>}
                            <span className="text-lg font-bold text-[#00A868]">{formatCurrency(stoneCosts.rent)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4">
                    <span className="text-red-400 font-bold mb-3 block">🖥️ Máquinas {competitorName}</span>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] text-slate-500 block mb-1">Quantidade</label><input type="number" min="1" value={competitorQtdMaquinas} onChange={(e) => setCompetitorQtdMaquinas(Number(e.target.value))} className={inputClass + " text-center"} /></div>
                        <div><label className="text-[10px] text-slate-500 block mb-1">Aluguel/mês</label><input type="number" step="0.01" value={competitorAluguel} onChange={(e) => setCompetitorAluguel(Number(e.target.value))} className={inputClass + " text-center text-red-400"} /></div>
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
                    <span className={`text-3xl font-bold ${economy > 0 ? 'text-[#00A868]' : 'text-amber-400'}`}>{economy > 0 ? '+' : ''}{formatCurrency(economy)}</span>
                    <span className="text-sm text-slate-400 block">{economyPercent.toFixed(1)}% mais barato</span>
                    <span className="text-xs text-slate-500 block mt-1">{formatCurrency(economy * 12)}/ano</span>
                </div>
            </div>
        </div>
    );
}
