'use client';

import { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Bandeiras disponíveis com cores
const CARD_BRANDS = [
    { name: 'VISA', color: '#1A1F71', icon: '💳' },
    { name: 'MASTER', color: '#EB001B', icon: '🔴' },
    { name: 'ELO', color: '#00A4E0', icon: '🔵' },
    { name: 'AMEX', color: '#006FCF', icon: '💎' },
    { name: 'HIPERCARD', color: '#B3131B', icon: '🔶' },
    { name: 'CABAL', color: '#00529B', icon: '🟦' },
];

// Adquirentes do mercado com emojis
const ACQUIRERS = [
    { id: 'rede', name: 'Rede', color: '#ED1C24', icon: '🔴' },
    { id: 'cielo', name: 'Cielo', color: '#0066B3', icon: '🔵' },
    { id: 'pagseguro', name: 'PagSeguro', color: '#FFC107', icon: '🟡' },
    { id: 'mercadopago', name: 'Mercado Pago', color: '#00B1EA', icon: '🟢' },
    { id: 'getnet', name: 'Getnet', color: '#E31B23', icon: '🟠' },
    { id: 'safrapay', name: 'Safrapay', color: '#F37021', icon: '🟧' },
    { id: 'sumup', name: 'SumUp', color: '#1A1F71', icon: '⬜' },
    { id: 'outros', name: 'Outros', color: '#6B7280', icon: '⚫' },
];

interface BrandRates {
    debit: number;
    credit1x: number;
    credit2to6: number;
    credit7to12: number;
    credit13to18: number;
    pix: number;
    rav: number;
}

interface BrandConfig {
    name: string;
    enabled: boolean;
    unified: boolean; // Se está unificada com outra bandeira
    unifiedWith?: string; // Nome da bandeira principal que unifica
}

const DEFAULT_RATES: BrandRates = {
    debit: 1.50, credit1x: 2.50, credit2to6: 3.00, credit7to12: 3.50, credit13to18: 3.99, pix: 1.00, rav: 1.50,
};

const DEFAULT_STONE_RATES: BrandRates = {
    debit: 0.84, credit1x: 1.86, credit2to6: 2.18, credit7to12: 2.41, credit13to18: 2.41, pix: 0.75, rav: 1.30,
};

export default function ComparativoPage() {
    const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
    const [competitorId, setCompetitorId] = useState('rede');

    // Volume (Modo Simples)
    const [volumeTotal, setVolumeTotal] = useState(100000);
    const [volumeDebit, setVolumeDebit] = useState(30000);
    const [volumeCredit, setVolumeCredit] = useState(50000);
    const [volumePix, setVolumePix] = useState(20000);

    // Volume por Bandeira (Modo Avançado) - { VISA: { debit: 10000, credit: 15000 }, ... }
    const [brandVolumes, setBrandVolumes] = useState<Record<string, { debit: number; credit: number }>>(() => {
        const initial: Record<string, { debit: number; credit: number }> = {};
        CARD_BRANDS.forEach(b => { initial[b.name] = { debit: 5000, credit: 10000 }; });
        return initial;
    });
    const [pixVolume, setPixVolume] = useState(20000);

    // Modelos de Máquinas Stone (oficiais)
    const STONE_MODELS = [
        { id: 'pos-smart', name: 'POS-Smart', aluguel: 0 },
        { id: 'gps-wifi', name: 'GPS-WIFI', aluguel: 0 },
    ];

    // Aluguel de Máquinas
    const [stoneModelo, setStoneModelo] = useState('pos-smart');
    const [stoneQtdMaquinas, setStoneQtdMaquinas] = useState(1);
    const [stoneAluguel, setStoneAluguel] = useState(0); // Stone geralmente não cobra
    const [competitorQtdMaquinas, setCompetitorQtdMaquinas] = useState(1);
    const [competitorAluguel, setCompetitorAluguel] = useState(49.90); // Aluguel típico

    // Modo Simples - taxas únicas
    const [stoneSimple, setStoneSimple] = useState<BrandRates>(DEFAULT_STONE_RATES);
    const [competitorSimple, setCompetitorSimple] = useState<BrandRates>(DEFAULT_RATES);

    // Modo Avançado - taxas por bandeira
    const [stoneBrands, setStoneBrands] = useState<Record<string, BrandRates>>({});
    const [competitorBrands, setCompetitorBrands] = useState<Record<string, BrandRates>>({});
    const [brandConfigs, setBrandConfigs] = useState<BrandConfig[]>(
        CARD_BRANDS.map((brand, i) => ({ name: brand.name, enabled: i < 2, unified: i === 1, unifiedWith: i === 1 ? 'VISA' : undefined }))
    );

    // Inicializa taxas por bandeira
    useEffect(() => {
        const initialStone: Record<string, BrandRates> = {};
        const initialComp: Record<string, BrandRates> = {};
        CARD_BRANDS.forEach(brand => {
            initialStone[brand.name] = { ...DEFAULT_STONE_RATES };
            initialComp[brand.name] = { ...DEFAULT_RATES };
        });
        setStoneBrands(initialStone);
        setCompetitorBrands(initialComp);
    }, []);

    const competitor = ACQUIRERS.find(a => a.id === competitorId) || ACQUIRERS[0];
    const competitorName = competitor.name;

    // Calcula shares
    const shares = useMemo(() => ({
        debit: volumeTotal > 0 ? (volumeDebit / volumeTotal) * 100 : 0,
        credit: volumeTotal > 0 ? (volumeCredit / volumeTotal) * 100 : 0,
        pix: volumeTotal > 0 ? (volumePix / volumeTotal) * 100 : 0,
    }), [volumeTotal, volumeDebit, volumeCredit, volumePix]);

    // Total volume avançado
    const advancedTotalVolume = useMemo(() => {
        let total = pixVolume;
        brandConfigs.filter(b => b.enabled && !b.unified).forEach(config => {
            const vol = brandVolumes[config.name] || { debit: 0, credit: 0 };
            total += vol.debit + vol.credit;
        });
        return total;
    }, [brandVolumes, pixVolume, brandConfigs]);

    // CET calculation
    const calculateCET = (mdr: number, rav: number, parcelas: number) => {
        const mdrDecimal = mdr / 100;
        const ravDecimal = rav / 100;
        const mediaMeses = (parcelas + 1) / 2;
        return (1 - (((100 * (1 - mdrDecimal)) * (1 - (ravDecimal * mediaMeses))) / 100)) * 100;
    };

    // Calcula custos (modo simples)
    const calculateCosts = (rates: BrandRates) => {
        const debitCost = (volumeDebit * rates.debit) / 100;
        const pixCost = (volumePix * rates.pix) / 100;
        const avgCET = calculateCET(rates.credit1x, rates.rav, 6);
        const creditCost = (volumeCredit * avgCET) / 100;
        return { debit: debitCost, credit: creditCost, pix: pixCost, total: debitCost + creditCost + pixCost };
    };

    // Calcula custos (modo avançado) - por bandeira
    const calculateAdvancedCosts = (brandsRates: Record<string, BrandRates>, pixRate: number) => {
        let totalDebit = 0;
        let totalCredit = 0;
        const byBrand: Record<string, { debit: number; credit: number }> = {};

        brandConfigs.filter(b => b.enabled && !b.unified).forEach(config => {
            const rates = brandsRates[config.name] || DEFAULT_STONE_RATES;
            const vol = brandVolumes[config.name] || { debit: 0, credit: 0 };

            const debitCost = (vol.debit * rates.debit) / 100;
            const avgCET = calculateCET(rates.credit1x, rates.rav, 6);
            const creditCost = (vol.credit * avgCET) / 100;

            byBrand[config.name] = { debit: debitCost, credit: creditCost };
            totalDebit += debitCost;
            totalCredit += creditCost;
        });

        const pixCost = (pixVolume * pixRate) / 100;
        return { debit: totalDebit, credit: totalCredit, pix: pixCost, total: totalDebit + totalCredit + pixCost, byBrand };
    };

    // Custos finais baseados no modo
    const stoneCosts = mode === 'simple'
        ? calculateCosts(stoneSimple)
        : calculateAdvancedCosts(stoneBrands, stoneSimple.pix);
    const competitorCosts = mode === 'simple'
        ? calculateCosts(competitorSimple)
        : calculateAdvancedCosts(competitorBrands, competitorSimple.pix);

    // Custos de aluguel mensais
    const stoneRentalCost = stoneQtdMaquinas * stoneAluguel;
    const competitorRentalCost = competitorQtdMaquinas * competitorAluguel;
    const rentalEconomy = competitorRentalCost - stoneRentalCost;

    // Economia total (taxas + aluguel)
    const totalStoneCost = stoneCosts.total + stoneRentalCost;
    const totalCompetitorCost = competitorCosts.total + competitorRentalCost;
    const economy = totalCompetitorCost - totalStoneCost;
    const economyPercent = totalCompetitorCost > 0 ? (economy / totalCompetitorCost) * 100 : 0;

    // Salvar dados para a Proposta
    useEffect(() => {
        const dataToSave = {
            volumeTotal: mode === 'simple' ? volumeTotal : advancedTotalVolume,
            stone: { debit: stoneSimple.debit, credit1x: stoneSimple.credit1x, pix: stoneSimple.pix },
            competitor: { name: competitorName, debit: competitorSimple.debit, credit1x: competitorSimple.credit1x, pix: competitorSimple.pix },
            economy: economy,
            maquinas: { stoneQtd: stoneQtdMaquinas, stoneAluguel: stoneAluguel, competitorQtd: competitorQtdMaquinas, competitorAluguel: competitorAluguel, isento: stoneAluguel === 0 },
        };
        localStorage.setItem('casa94_comparativo', JSON.stringify(dataToSave));
    }, [mode, volumeTotal, stoneSimple, competitorSimple, competitorName, economy, advancedTotalVolume, stoneQtdMaquinas, stoneAluguel, competitorQtdMaquinas, competitorAluguel]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    // Puxar dados do CET
    const pullFromCET = () => {
        const data = localStorage.getItem('casa94_stone_rates');
        if (data) {
            const { ravRate, containers } = JSON.parse(data);
            if (containers && containers.length > 0) {
                // Atualiza taxas Stone com dados do CET
                const first = containers[0];
                setStoneSimple({
                    debit: first.debit,
                    credit1x: first.credit1x,
                    credit2to6: first.credit2to6,
                    credit7to12: first.credit7to12,
                    credit13to18: first.credit13to18,
                    pix: stoneSimple.pix,
                    rav: ravRate,
                });

                // Atualiza taxas por bandeira também
                const newStoneBrands = { ...stoneBrands };
                containers.forEach((c: any) => {
                    const brandName = c.name.toUpperCase();
                    if (brandName.includes('VISA') || brandName.includes('MASTER')) {
                        newStoneBrands['VISA'] = { ...newStoneBrands['VISA'], ...c, rav: ravRate };
                        newStoneBrands['MASTER'] = { ...newStoneBrands['MASTER'], ...c, rav: ravRate };
                    } else {
                        const matchedBrand = CARD_BRANDS.find(b => brandName.includes(b.name));
                        if (matchedBrand) {
                            newStoneBrands[matchedBrand.name] = { ...newStoneBrands[matchedBrand.name], ...c, rav: ravRate };
                        }
                    }
                });
                setStoneBrands(newStoneBrands);
                alert('✅ Taxas importadas do Calculador CET!');
            }
        } else {
            alert('⚠️ Nenhum dado encontrado. Configure as taxas no Calculador CET primeiro.');
        }
    };

    // Reset
    const resetAll = () => {
        setStoneSimple(DEFAULT_STONE_RATES);
        setCompetitorSimple(DEFAULT_RATES);
        setVolumeTotal(100000);
        setVolumeDebit(30000);
        setVolumeCredit(50000);
        setVolumePix(20000);
    };

    // Get enabled brands (for advanced mode)
    const enabledBrands = brandConfigs.filter(b => b.enabled && !b.unified);

    // Toggle brand
    const toggleBrand = (name: string) => {
        setBrandConfigs(prev => prev.map(b => b.name === name ? { ...b, enabled: !b.enabled } : b));
    };

    // Unify brand
    const unifyBrand = (name: string, withBrand: string | null) => {
        setBrandConfigs(prev => prev.map(b =>
            b.name === name
                ? { ...b, unified: !!withBrand, unifiedWith: withBrand || undefined }
                : b
        ));
    };

    // Export PDF - Paisagem, profissional
    const exportPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Header com logo Stone (texto estilizado) + CASA 94
        doc.setFillColor(0, 168, 104);
        doc.rect(0, 0, pageWidth, 25, 'F');

        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text('stone', 20, 16);
        doc.setFontSize(8);
        doc.text('®', 45, 10);

        doc.setFontSize(22);
        doc.text('CASA 94', pageWidth / 2, 16, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Fidelidade: 13 Meses`, pageWidth - 20, 16, { align: 'right' });

        // Info linha
        doc.setTextColor(80);
        doc.setFontSize(9);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35);
        doc.text(`TPV / Volume: ${formatCurrency(volumeTotal)}`, 80, 35);
        doc.text(`Débito: ${shares.debit.toFixed(0)}% | Crédito: ${shares.credit.toFixed(0)}% | PIX: ${shares.pix.toFixed(0)}%`, 160, 35);

        // COLUNA 1: Taxas Stone (esquerda)
        doc.setFontSize(11);
        doc.setTextColor(0, 168, 104);
        doc.text('TAXAS STONE', 20, 48);

        autoTable(doc, {
            startY: 52,
            margin: { left: 20 },
            tableWidth: 80,
            head: [['Tipo', 'Taxa']],
            body: [
                ['Débito', `${stoneSimple.debit.toFixed(2)}%`],
                ['Crédito à vista', `${stoneSimple.credit1x.toFixed(2)}%`],
                ['Parcelado 2 a 6x', `${stoneSimple.credit2to6.toFixed(2)}%`],
                ['Parcelado 7 a 12x', `${stoneSimple.credit7to12.toFixed(2)}%`],
                ['Parcelado 13 a 18x', `${stoneSimple.credit13to18.toFixed(2)}%`],
                ['Antecipação (RAV)', `${stoneSimple.rav.toFixed(2)}%`],
                ['PIX', `${stoneSimple.pix.toFixed(2)}%`],
            ],
            headStyles: { fillColor: [0, 168, 104], fontSize: 8 },
            bodyStyles: { fontSize: 8 },
            columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 30, halign: 'right' } },
        });

        // COLUNA 2: CET Stone VISA/MASTER (centro-esquerda)
        doc.setFontSize(11);
        doc.setTextColor(0, 168, 104);
        doc.text('CET VISA/MASTER', 115, 48);
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.text(`Débito: ${stoneSimple.debit.toFixed(2)}%`, 115, 53);

        // Calcular CET table para VISA/MASTER
        const ravRate = stoneSimple.rav;
        const getCET = (mdr: number, parcelas: number) => {
            const avgMonths = (1 + parcelas) / 2;
            const ravFactor = 1 - (ravRate / 100 * avgMonths);
            return (1 - ((100 * (1 - mdr / 100)) * ravFactor) / 100) * 100;
        };

        const cetData: string[][] = [];
        for (let i = 1; i <= 9; i++) {
            const mdr = i === 1 ? stoneSimple.credit1x : i <= 6 ? stoneSimple.credit2to6 : stoneSimple.credit7to12;
            const cet1 = getCET(mdr, i);
            const mdr2 = i + 9 <= 12 ? stoneSimple.credit7to12 : stoneSimple.credit13to18;
            const cet2 = getCET(mdr2, i + 9);
            cetData.push([`${i}x`, `${cet1.toFixed(2)}%`, `${i + 9}x`, `${cet2.toFixed(2)}%`]);
        }

        autoTable(doc, {
            startY: 56,
            margin: { left: 115 },
            tableWidth: 65,
            head: [['Parc.', 'CET', 'Parc.', 'CET']],
            body: cetData,
            headStyles: { fillColor: [0, 168, 104], fontSize: 7 },
            bodyStyles: { fontSize: 7 },
            columnStyles: {
                0: { cellWidth: 12 }, 1: { cellWidth: 20, halign: 'right' },
                2: { cellWidth: 12 }, 3: { cellWidth: 20, halign: 'right' }
            },
        });

        // COLUNA 3: Taxas Concorrente (centro-direita)
        doc.setFontSize(11);
        doc.setTextColor(220, 53, 69);
        doc.text(`TAXAS ${competitorName.toUpperCase()}`, 195, 48);

        autoTable(doc, {
            startY: 52,
            margin: { left: 195 },
            tableWidth: 80,
            head: [['Tipo', 'Taxa']],
            body: [
                ['Débito', `${competitorSimple.debit.toFixed(2)}%`],
                ['Crédito à vista', `${competitorSimple.credit1x.toFixed(2)}%`],
                ['Parcelado 2 a 6x', `${competitorSimple.credit2to6.toFixed(2)}%`],
                ['Parcelado 7 a 12x', `${competitorSimple.credit7to12.toFixed(2)}%`],
                ['Parcelado 13 a 18x', `${competitorSimple.credit13to18.toFixed(2)}%`],
                ['Antecipação (RAV)', `${competitorSimple.rav.toFixed(2)}%`],
                ['PIX', `${competitorSimple.pix.toFixed(2)}%`],
            ],
            headStyles: { fillColor: [220, 53, 69], fontSize: 8 },
            bodyStyles: { fontSize: 8 },
            columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 30, halign: 'right' } },
        });

        // Economia - Rodapé destacado
        const footerY = pageHeight - 30;
        if (economy > 0) {
            doc.setFillColor(0, 168, 104);
            doc.rect(20, footerY, pageWidth - 40, 20, 'F');
            doc.setTextColor(255);
            doc.setFontSize(12);
            doc.text('💰 ECONOMIA COM STONE', 30, footerY + 8);
            doc.setFontSize(16);
            doc.text(`${formatCurrency(economy)} /mês`, pageWidth / 2, footerY + 10, { align: 'center' });
            doc.setFontSize(12);
            doc.text(`${formatCurrency(economy * 12)} /ano`, pageWidth / 2, footerY + 17, { align: 'center' });
            doc.text(`${economyPercent.toFixed(1)}% mais barato`, pageWidth - 30, footerY + 12, { align: 'right' });
        } else if (economy < 0) {
            doc.setFillColor(255, 193, 7);
            doc.rect(20, footerY, pageWidth - 40, 20, 'F');
            doc.setTextColor(0);
            doc.setFontSize(12);
            doc.text(`${competitorName} oferece taxas mais competitivas: ${formatCurrency(Math.abs(economy))}/mês`, pageWidth / 2, footerY + 12, { align: 'center' });
        }

        // Custos totais
        const costsY = footerY - 15;
        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.text(`Stone: D ${formatCurrency(stoneCosts.debit)} | C ${formatCurrency(stoneCosts.credit)} | P ${formatCurrency(stoneCosts.pix)} = ${formatCurrency(stoneCosts.total)}`, 20, costsY);
        doc.text(`${competitorName}: D ${formatCurrency(competitorCosts.debit)} | C ${formatCurrency(competitorCosts.credit)} | P ${formatCurrency(competitorCosts.pix)} = ${formatCurrency(competitorCosts.total)}`, pageWidth / 2, costsY);

        doc.save(`Comparativo_Stone_vs_${competitorName}.pdf`);
    };

    // Export Excel
    const exportExcel = () => {
        const wsData = [
            ['CASA 94 - Comparativo de Taxas'],
            [''],
            ['Volume Total:', formatCurrency(volumeTotal)],
            [''],
            ['Taxa', 'Stone', competitorName, 'Diferença'],
            ['Débito', `${stoneSimple.debit}%`, `${competitorSimple.debit}%`, `${(competitorSimple.debit - stoneSimple.debit).toFixed(2)}%`],
            ['Crédito 1x', `${stoneSimple.credit1x}%`, `${competitorSimple.credit1x}%`, `${(competitorSimple.credit1x - stoneSimple.credit1x).toFixed(2)}%`],
            [''],
            ['ECONOMIA MENSAL', formatCurrency(economy)],
            ['ECONOMIA ANUAL', formatCurrency(economy * 12)],
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Comparativo');
        XLSX.writeFile(wb, `Comparativo_Stone_vs_${competitorName}.xlsx`);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Comparação de Taxas</h1>
                    <p className="text-slate-400 text-sm">Stone vs Concorrente</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Mode Toggle */}
                    <div className="flex bg-slate-800 rounded-lg p-0.5">
                        <button onClick={() => setMode('simple')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'simple' ? 'bg-[#00A868] text-white' : 'text-slate-400 hover:text-white'}`}>
                            Simples
                        </button>
                        <button onClick={() => setMode('advanced')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'advanced' ? 'bg-[#00A868] text-white' : 'text-slate-400 hover:text-white'}`}>
                            Avançado
                        </button>
                    </div>
                    <button onClick={resetAll} className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs rounded-lg">🔄 Limpar</button>
                    <button onClick={pullFromCET} className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded-lg">📡 Puxar CET</button>
                    <button onClick={exportPDF} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs rounded-lg">📄 PDF</button>
                    <button onClick={exportExcel} className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs rounded-lg">📊 Excel</button>
                </div>
            </div>

            {/* Volume + Share - Cards Grandes */}
            {mode === 'simple' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {/* TPV */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2">
                        <label className="text-[10px] text-slate-500">TPV Total</label>
                        <input type="number" value={volumeTotal} onChange={(e) => setVolumeTotal(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-sm mt-1" />
                        <div className="grid grid-cols-3 gap-1 mt-1">
                            <div>
                                <label className="text-[8px] text-slate-500">Déb</label>
                                <input type="number" value={volumeDebit} onChange={(e) => setVolumeDebit(Number(e.target.value))}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded px-1 py-0.5 text-white text-[10px] text-center" />
                            </div>
                            <div>
                                <label className="text-[8px] text-slate-500">Créd</label>
                                <input type="number" value={volumeCredit} onChange={(e) => setVolumeCredit(Number(e.target.value))}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded px-1 py-0.5 text-white text-[10px] text-center" />
                            </div>
                            <div>
                                <label className="text-[8px] text-slate-500">PIX</label>
                                <input type="number" value={volumePix} onChange={(e) => setVolumePix(Number(e.target.value))}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded px-1 py-0.5 text-white text-[10px] text-center" />
                            </div>
                        </div>
                    </div>
                    {/* Share Débito */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 text-center flex flex-col justify-center">
                        <span className="text-blue-400 text-sm">💳</span>
                        <p className="text-2xl font-bold text-blue-400">{shares.debit.toFixed(0)}%</p>
                        <p className="text-[10px] text-slate-400">Débito</p>
                    </div>
                    {/* Share Crédito */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 text-center flex flex-col justify-center">
                        <span className="text-purple-400 text-sm">💎</span>
                        <p className="text-2xl font-bold text-purple-400">{shares.credit.toFixed(0)}%</p>
                        <p className="text-[10px] text-slate-400">Crédito</p>
                    </div>
                    {/* Share PIX */}
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2 text-center flex flex-col justify-center">
                        <span className="text-cyan-400 text-sm">⚡</span>
                        <p className="text-2xl font-bold text-cyan-400">{shares.pix.toFixed(0)}%</p>
                        <p className="text-[10px] text-slate-400">PIX</p>
                    </div>
                </div>
            )}

            {/* Modo Avançado - Bandeiras + Volume Inline */}
            {mode === 'advanced' && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2 space-y-2">
                    {/* Bandeiras Toggle */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-slate-500">Bandeiras:</span>
                        {brandConfigs.map(config => (
                            <button key={config.name} onClick={() => toggleBrand(config.name)}
                                className={`px-2 py-0.5 text-[10px] rounded border ${config.enabled ? 'bg-[#00A868]/20 border-[#00A868]/50 text-[#00A868]' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                {config.name}
                            </button>
                        ))}
                        <span className="ml-auto text-[10px] text-[#00A868] font-semibold">Total: {formatCurrency(advancedTotalVolume)}</span>
                    </div>
                    {/* Volume por Bandeira - Grid compacto */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1">
                        {brandConfigs.filter(b => b.enabled && !b.unified).map(config => {
                            const brand = CARD_BRANDS.find(cb => cb.name === config.name);
                            const vol = brandVolumes[config.name] || { debit: 0, credit: 0 };
                            return (
                                <div key={config.name} className="bg-slate-800/50 border border-slate-700 rounded p-1">
                                    <p className="text-[10px] font-medium truncate" style={{ color: brand?.color || '#fff' }}>{config.name}</p>
                                    <div className="flex gap-1 mt-0.5">
                                        <input type="number" value={vol.debit} placeholder="D"
                                            onChange={(e) => setBrandVolumes({ ...brandVolumes, [config.name]: { ...vol, debit: Number(e.target.value) } })}
                                            className="w-full bg-slate-900 border border-slate-600 rounded px-1 py-0.5 text-white text-[10px] text-center" />
                                        <input type="number" value={vol.credit} placeholder="C"
                                            onChange={(e) => setBrandVolumes({ ...brandVolumes, [config.name]: { ...vol, credit: Number(e.target.value) } })}
                                            className="w-full bg-slate-900 border border-slate-600 rounded px-1 py-0.5 text-white text-[10px] text-center" />
                                    </div>
                                </div>
                            );
                        })}
                        {/* PIX */}
                        <div className="bg-slate-800/50 border border-cyan-500/30 rounded p-1">
                            <p className="text-[10px] font-medium text-cyan-400">⚡ PIX</p>
                            <input type="number" value={pixVolume} onChange={(e) => setPixVolume(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-cyan-500/30 rounded px-1 py-0.5 text-white text-[10px] text-center mt-0.5" />
                        </div>
                    </div>
                </div>
            )}

            {/* Tabela de Taxas - Containers Separados */}
            {mode === 'simple' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                    {/* Container Stone */}
                    <div className="bg-slate-900/50 border border-[#00A868]/30 rounded-lg overflow-hidden">
                        <div className="bg-[#00A868] px-3 py-1.5 flex items-center justify-between">
                            <span className="text-white font-bold text-sm">Stone</span>
                            <span className="text-white/80 text-[10px]">Taxas MDR</span>
                        </div>
                        <div className="p-2">
                            {[
                                { label: 'Débito', key: 'debit' },
                                { label: 'Crédito à vista', key: 'credit1x' },
                                { label: 'Parcelado 2-6x', key: 'credit2to6' },
                                { label: 'Parcelado 7-12x', key: 'credit7to12' },
                                { label: 'Parcelado 13-18x', key: 'credit13to18' },
                                { label: 'Antecipação (RAV)', key: 'rav' },
                                { label: 'PIX', key: 'pix' },
                            ].map((row) => (
                                <div key={row.key} className="flex items-center justify-between py-0.5 border-b border-slate-800/50">
                                    <span className="text-[10px] text-slate-400">{row.label}</span>
                                    <input type="number" step="0.01" value={stoneSimple[row.key as keyof BrandRates]}
                                        onChange={(e) => setStoneSimple({ ...stoneSimple, [row.key]: Number(e.target.value) })}
                                        className="w-16 bg-slate-800 border border-[#00A868]/30 rounded px-1 py-0.5 text-[#00A868] text-xs text-center font-medium" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Container Concorrente */}
                    <div className="bg-slate-900/50 border border-red-500/30 rounded-lg overflow-hidden">
                        <div className="px-3 py-1.5 flex items-center justify-between" style={{ backgroundColor: competitor.color }}>
                            <select value={competitorId} onChange={(e) => setCompetitorId(e.target.value)}
                                className="bg-transparent border-0 text-white font-bold text-sm focus:ring-0 cursor-pointer">
                                {ACQUIRERS.map(a => <option key={a.id} value={a.id} className="text-slate-900">{a.name}</option>)}
                            </select>
                            <span className="text-white/80 text-[10px]">Taxas MDR</span>
                        </div>
                        <div className="p-2">
                            {[
                                { label: 'Débito', key: 'debit' },
                                { label: 'Crédito à vista', key: 'credit1x' },
                                { label: 'Parcelado 2-6x', key: 'credit2to6' },
                                { label: 'Parcelado 7-12x', key: 'credit7to12' },
                                { label: 'Parcelado 13-18x', key: 'credit13to18' },
                                { label: 'Antecipação (RAV)', key: 'rav' },
                                { label: 'PIX', key: 'pix' },
                            ].map((row) => (
                                <div key={row.key} className="flex items-center justify-between py-0.5 border-b border-slate-800/50">
                                    <span className="text-[10px] text-slate-400">{row.label}</span>
                                    <input type="number" step="0.01" value={competitorSimple[row.key as keyof BrandRates]}
                                        onChange={(e) => setCompetitorSimple({ ...competitorSimple, [row.key]: Number(e.target.value) })}
                                        className="w-16 bg-slate-800 border border-red-500/30 rounded px-1 py-0.5 text-red-400 text-xs text-center font-medium" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Container Diferença */}
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
                        <div className="bg-slate-700 px-3 py-1.5">
                            <span className="text-white font-bold text-sm">Diferença</span>
                        </div>
                        <div className="p-2">
                            {[
                                { label: 'Débito', key: 'debit' },
                                { label: 'Crédito à vista', key: 'credit1x' },
                                { label: 'Parcelado 2-6x', key: 'credit2to6' },
                                { label: 'Parcelado 7-12x', key: 'credit7to12' },
                                { label: 'Parcelado 13-18x', key: 'credit13to18' },
                                { label: 'Antecipação (RAV)', key: 'rav' },
                                { label: 'PIX', key: 'pix' },
                            ].map((row) => {
                                const diff = competitorSimple[row.key as keyof BrandRates] - stoneSimple[row.key as keyof BrandRates];
                                return (
                                    <div key={row.key} className="flex items-center justify-between py-0.5 border-b border-slate-800/50">
                                        <span className="text-[10px] text-slate-400">{row.label}</span>
                                        <span className={`text-xs font-bold ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                            {diff > 0 ? '+' : ''}{diff.toFixed(2)}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {mode === 'advanced' && (
                // Modo Avançado - Por Bandeira
                enabledBrands.map(config => (
                    <div key={config.name} className="border-b border-slate-700">
                        <div className="px-3 py-2 bg-slate-800/30 text-xs font-semibold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#00A868]"></span>
                            {config.name}
                        </div>
                        {['debit', 'credit1x', 'credit2to6', 'credit7to12', 'pix', 'rav'].map(key => {
                            const labels: Record<string, string> = { debit: 'Débito', credit1x: '1x', credit2to6: '2-6x', credit7to12: '7-12x', pix: 'PIX', rav: 'RAV' };
                            const stoneVal = stoneBrands[config.name]?.[key as keyof BrandRates] || 0;
                            const compVal = competitorBrands[config.name]?.[key as keyof BrandRates] || 0;
                            const diff = compVal - stoneVal;
                            return (
                                <div key={key} className="grid grid-cols-4 border-b border-slate-800/30 items-center">
                                    <div className="px-3 py-1 text-xs text-slate-400 pl-6">{labels[key]}</div>
                                    <div className="px-2 py-0.5">
                                        <input type="number" step="0.01" value={stoneVal}
                                            onChange={(e) => setStoneBrands({ ...stoneBrands, [config.name]: { ...stoneBrands[config.name], [key]: Number(e.target.value) } })}
                                            className="w-full max-w-[55px] mx-auto block bg-slate-800 border border-[#00A868]/30 rounded px-1 py-0.5 text-[#00A868] text-xs text-center" />
                                    </div>
                                    <div className="px-2 py-0.5">
                                        <input type="number" step="0.01" value={compVal}
                                            onChange={(e) => setCompetitorBrands({ ...competitorBrands, [config.name]: { ...competitorBrands[config.name], [key]: Number(e.target.value) } })}
                                            className="w-full max-w-[55px] mx-auto block bg-slate-800 border border-red-500/30 rounded px-1 py-0.5 text-red-400 text-xs text-center" />
                                    </div>
                                    <div className={`px-2 py-1 text-xs text-center font-bold ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                        {diff > 0 ? '+' : ''}{diff.toFixed(2)}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))
            )}

            {/* Aluguel de Máquinas - Design Moderno */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Stone Máquinas - Card Futurista */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00A868]/20 via-slate-900/80 to-slate-900/90 border border-[#00A868]/40 backdrop-blur-xl">
                    {/* Glow Effect */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#00A868]/20 rounded-full blur-3xl" />

                    {/* Header */}
                    <div className="relative px-4 py-3 border-b border-[#00A868]/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00A868]/30 flex items-center justify-center">
                                    <span className="text-lg">🖥️</span>
                                </div>
                                <div>
                                    <span className="text-white font-bold text-sm">Máquinas Stone</span>
                                    {(() => {
                                        // Cálculo de máquinas isentas por volume
                                        const tpv = mode === 'simple' ? volumeTotal : advancedTotalVolume;
                                        let maquinasIsentas = 0;
                                        if (tpv >= 10000 && tpv < 30000) maquinasIsentas = 1;
                                        else if (tpv >= 30000 && tpv < 50000) maquinasIsentas = 2;
                                        else if (tpv >= 50000 && tpv < 100000) maquinasIsentas = 4;
                                        else if (tpv >= 100000) maquinasIsentas = 4 + Math.floor((tpv - 50000) / 50000) * 2;

                                        return maquinasIsentas > 0 ? (
                                            <p className="text-[10px] text-[#00A868]">✓ {maquinasIsentas} máquina{maquinasIsentas > 1 ? 's' : ''} isenta{maquinasIsentas > 1 ? 's' : ''} por volume</p>
                                        ) : null;
                                    })()}
                                </div>
                            </div>

                            {/* Botão Isenção por Volume */}
                            <button
                                onClick={() => {
                                    const tpv = mode === 'simple' ? volumeTotal : advancedTotalVolume;
                                    let maquinasIsentas = 0;
                                    if (tpv >= 10000 && tpv < 30000) maquinasIsentas = 1;
                                    else if (tpv >= 30000 && tpv < 50000) maquinasIsentas = 2;
                                    else if (tpv >= 50000 && tpv < 100000) maquinasIsentas = 4;
                                    else if (tpv >= 100000) maquinasIsentas = 4 + Math.floor((tpv - 50000) / 50000) * 2;

                                    if (maquinasIsentas > 0) {
                                        setStoneQtdMaquinas(maquinasIsentas);
                                        setStoneAluguel(0);
                                    } else {
                                        alert('TPV mínimo de R$ 10.000 para isenção');
                                    }
                                }}
                                className="px-3 py-1.5 bg-[#00A868]/30 hover:bg-[#00A868]/50 border border-[#00A868]/50 rounded-lg text-[10px] text-[#00A868] font-medium transition-all hover:scale-105"
                            >
                                ⚡ Isenção por Volume
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Modelo</label>
                                <select value={stoneModelo} onChange={(e) => setStoneModelo(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-2 py-2 text-white text-xs focus:border-[#00A868]/50 focus:ring-1 focus:ring-[#00A868]/30 transition-all">
                                    {STONE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Quantidade</label>
                                <input type="number" min="1" value={stoneQtdMaquinas} onChange={(e) => setStoneQtdMaquinas(Number(e.target.value))}
                                    className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-2 py-2 text-white text-xs text-center focus:border-[#00A868]/50 focus:ring-1 focus:ring-[#00A868]/30 transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Aluguel/mês</label>
                                <input type="number" step="0.01" value={stoneAluguel} onChange={(e) => setStoneAluguel(Number(e.target.value))}
                                    className="w-full bg-slate-800/50 border border-[#00A868]/30 rounded-lg px-2 py-2 text-[#00A868] text-xs text-center font-medium focus:border-[#00A868]/50 focus:ring-1 focus:ring-[#00A868]/30 transition-all" />
                            </div>
                        </div>

                        {/* Total com destaque */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                            <span className="text-xs text-slate-400">Total Mensal:</span>
                            <div className="flex items-center gap-2">
                                {stoneAluguel === 0 && (
                                    <span className="px-2 py-0.5 bg-[#00A868]/20 text-[#00A868] text-[10px] font-medium rounded-full">ISENTO</span>
                                )}
                                <span className="text-lg font-bold text-[#00A868]">{formatCurrency(stoneRentalCost)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Concorrente Máquinas - Card Futurista */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-slate-900/80 to-slate-900/90 border border-red-500/30 backdrop-blur-xl">
                    {/* Glow Effect */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />

                    {/* Header */}
                    <div className="relative px-4 py-3 border-b border-red-500/20">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <span className="text-lg">🖥️</span>
                            </div>
                            <span className="font-bold text-sm" style={{ color: competitor.color }}>Máquinas {competitorName}</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Quantidade</label>
                                <input type="number" min="1" value={competitorQtdMaquinas} onChange={(e) => setCompetitorQtdMaquinas(Number(e.target.value))}
                                    className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-2 py-2 text-white text-xs text-center focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Aluguel/mês (cada)</label>
                                <input type="number" step="0.01" value={competitorAluguel} onChange={(e) => setCompetitorAluguel(Number(e.target.value))}
                                    className="w-full bg-slate-800/50 border border-red-500/30 rounded-lg px-2 py-2 text-red-400 text-xs text-center font-medium focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all" />
                            </div>
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                            <span className="text-xs text-slate-400">Total Mensal:</span>
                            <span className="text-lg font-bold text-red-400">{formatCurrency(competitorRentalCost)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resumo Final - Custos + Economia */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Stone Total */}
                    <div className="bg-[#00A868]/10 border border-[#00A868]/30 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-slate-400 mb-1">💎 Stone Total</p>
                        <p className="text-[10px] text-slate-400">Taxas: {formatCurrency(stoneCosts.total)}</p>
                        <p className="text-[10px] text-slate-400">Aluguel: {formatCurrency(stoneRentalCost)}</p>
                        <p className="text-lg font-bold text-[#00A868]">{formatCurrency(totalStoneCost)}</p>
                    </div>

                    {/* Concorrente Total */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-slate-400 mb-1">{competitor.icon} {competitorName} Total</p>
                        <p className="text-[10px] text-slate-400">Taxas: {formatCurrency(competitorCosts.total)}</p>
                        <p className="text-[10px] text-slate-400">Aluguel: {formatCurrency(competitorRentalCost)}</p>
                        <p className="text-lg font-bold text-red-400">{formatCurrency(totalCompetitorCost)}</p>
                    </div>

                    {/* Economia */}
                    <div className={`rounded-lg p-2 text-center ${economy > 0 ? 'bg-[#00A868]/20 border border-[#00A868]/50' : economy < 0 ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-slate-700/50 border border-slate-600'}`}>
                        <p className="text-[10px] text-slate-400 mb-1">💰 Economia Mensal</p>
                        {rentalEconomy !== 0 && (
                            <p className="text-[10px] text-slate-400">Aluguel: {rentalEconomy > 0 ? '+' : ''}{formatCurrency(rentalEconomy)}</p>
                        )}
                        <p className="text-2xl font-bold" style={{ color: economy > 0 ? '#00A868' : economy < 0 ? '#f59e0b' : '#94a3b8' }}>
                            {economy > 0 ? '+' : ''}{formatCurrency(economy)}
                        </p>
                        <p className="text-[10px] text-slate-400">{economyPercent.toFixed(1)}% {economy > 0 ? 'mais barato' : economy < 0 ? 'mais caro' : 'igual'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
