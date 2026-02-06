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

    const [contractType, setContractType] = useState<'fidelity' | 'adhesion'>('fidelity');

    // Export PDF - Paisagem, profissional com prompt de cliente
    const exportPDF = () => {
        // Prompt para dados do cliente
        const clienteNome = prompt('Nome da Empresa/Cliente:')?.trim();
        if (!clienteNome) return;
        const clienteCNPJ = prompt('CNPJ/CPF (opcional):')?.trim() || '';

        const doc = new jsPDF({ orientation: 'landscape' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Header verde Stone
        doc.setFillColor(0, 168, 104);
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Logo STONE centralizado
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(32);
        doc.setFont('helvetica', 'bold');
        doc.text('STONE', pageWidth / 2, 20, { align: 'center' });

        // Subtítulo
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('PROPOSTA COMPARATIVA', pageWidth / 2, 30, { align: 'center' });

        // Data no canto direito
        doc.setFontSize(10);
        doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 15, 15, { align: 'right' });

        // === QUADRINHOS INFORMATIVOS (Abaixo do Header, Lado Esquerdo) ===
        // Box 1: Taxa de Antecipação
        doc.setFillColor(240, 253, 244); // Fundo claro verde
        doc.setDrawColor(0, 168, 104); // Borda verde
        doc.rect(15, 45, 60, 22, 'FD');

        doc.setFontSize(8);
        doc.setTextColor(0, 168, 104);
        doc.setFont('helvetica', 'bold');
        doc.text('TAXA DE ANTECIPAÇÃO', 45, 50, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(50, 50, 50);
        doc.text(`${stoneSimple.rav.toFixed(2)}%`, 45, 60, { align: 'center' });

        // Box 2: Regras de Contrato / Isenção
        doc.setFillColor(248, 250, 252); // Fundo cinza claro
        doc.setDrawColor(148, 163, 184); // Borda cinza
        doc.rect(80, 45, 120, 22, 'FD');

        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'bold');

        const contractLabel = contractType === 'fidelity' ? 'FIDELIDADE 13 MESES' : 'TERMO DE ADESÃO';
        doc.text(contractLabel, 140, 50, { align: 'center' });

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);

        // Lógica de texto baseada no contrato e TPV
        const tpv = mode === 'simple' ? volumeTotal : advancedTotalVolume;
        let machineText = '';

        if (contractType === 'fidelity') {
            doc.text('(Primeiro mês isento)', 140, 54, { align: 'center' });

            // Regra TPV
            let maquinasIsentas = 0;
            if (tpv >= 10000 && tpv < 30000) maquinasIsentas = 1;
            else if (tpv >= 30000 && tpv < 50000) maquinasIsentas = 2;
            else if (tpv >= 50000 && tpv < 100000) maquinasIsentas = 4;
            else if (tpv >= 100000) maquinasIsentas = 4 + Math.floor((tpv - 50000) / 50000) * 2;

            machineText = `Isenção por TPV: 10k(1), 30k(2), 50k(4) e +2 a cada 50k.`;
            doc.text(machineText, 140, 60, { align: 'center' });
            doc.text(`Volume atual (${formatCurrency(tpv)}): ${maquinasIsentas} maq. isenta(s).`, 140, 64, { align: 'center' });
        } else {
            // Adesão
            doc.text('R$ 478,80', 140, 54, { align: 'center' });
            if (stoneQtdMaquinas > 1) {
                doc.text('Isenção aplicada (Mais de 1 máquina no termo de adesão)', 140, 60, { align: 'center' });
            } else {
                doc.text('1 Adesão. (Isenção aplica-se se houver > 1 máquina)', 140, 60, { align: 'center' });
            }
        }

        // Dados do cliente (Ajustado posição)
        const clientY = 75;
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(clienteNome, 15, clientY);
        if (clienteCNPJ) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`CNPJ/CPF: ${clienteCNPJ}`, 15, clientY + 5);
        }

        let yPos = clientY + 12;

        // Info de volume
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(`Volume Mensal: ${formatCurrency(volumeTotal)}`, 15, yPos);
        doc.text(`Débito: ${shares.debit.toFixed(0)}% | Crédito: ${shares.credit.toFixed(0)}% | PIX: ${shares.pix.toFixed(0)}%`, 100, yPos);
        yPos += 12;

        // Tabela Stone
        doc.setFontSize(12);
        doc.setTextColor(0, 168, 104);
        doc.setFont('helvetica', 'bold');
        doc.text('TAXAS STONE', 15, yPos);

        autoTable(doc, {
            startY: yPos + 4,
            margin: { left: 15 },
            tableWidth: 130,
            head: [['Débito', 'Crédito 1x', '2-6x', '7-12x', '13-18x', 'PIX']],
            body: [[
                `${stoneSimple.debit.toFixed(2)}%`,
                `${stoneSimple.credit1x.toFixed(2)}%`,
                `${stoneSimple.credit2to6.toFixed(2)}%`,
                `${stoneSimple.credit7to12.toFixed(2)}%`,
                `${stoneSimple.credit13to18.toFixed(2)}%`,
                `${stoneSimple.pix.toFixed(2)}%`,
            ]],
            theme: 'grid',
            headStyles: { fillColor: [0, 168, 104], textColor: [255, 255, 255], fontSize: 8 },
            bodyStyles: { fontSize: 10, fontStyle: 'bold', halign: 'center' },
        });

        // Tabela Concorrente
        doc.setFontSize(12);
        doc.setTextColor(220, 53, 69);
        doc.text(`TAXAS ${competitorName.toUpperCase()}`, 160, yPos);

        autoTable(doc, {
            startY: yPos + 4,
            margin: { left: 160 },
            tableWidth: 130,
            head: [['Débito', 'Crédito 1x', '2-6x', '7-12x', '13-18x', 'PIX']],
            body: [[
                `${competitorSimple.debit.toFixed(2)}%`,
                `${competitorSimple.credit1x.toFixed(2)}%`,
                `${competitorSimple.credit2to6.toFixed(2)}%`,
                `${competitorSimple.credit7to12.toFixed(2)}%`,
                `${competitorSimple.credit13to18.toFixed(2)}%`,
                `${competitorSimple.pix.toFixed(2)}%`,
            ]],
            theme: 'grid',
            headStyles: { fillColor: [220, 53, 69], textColor: [255, 255, 255], fontSize: 8 },
            bodyStyles: { fontSize: 10, fontStyle: 'bold', halign: 'center' },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Economia destaque
        if (economy > 0) {
            doc.setFillColor(0, 168, 104);
            doc.roundedRect(15, yPos, pageWidth - 30, 30, 5, 5, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('ECONOMIA COM STONE', 25, yPos + 12);
            doc.setFontSize(20);
            doc.text(`${formatCurrency(economy)}/mês`, pageWidth / 2, yPos + 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text(`${formatCurrency(economy * 12)}/ano`, pageWidth / 2, yPos + 24, { align: 'center' });
            doc.text(`${economyPercent.toFixed(1)}% mais barato`, pageWidth - 25, yPos + 18, { align: 'right' });
        }

        // Rodapé removido conforme solicitado ("tire eses PROPOSTA VALIDA")
        doc.save(`Proposta_${clienteNome.replace(/\s+/g, '_')}_Comparativo.pdf`);
    };

    // Export Excel com prompt de cliente
    const exportExcel = () => {
        const clienteNome = prompt('Nome da Empresa/Cliente:')?.trim();
        if (!clienteNome) return;
        const clienteCNPJ = prompt('CNPJ/CPF (opcional):')?.trim() || '';

        const wsData = [
            ['STONE - PROPOSTA COMPARATIVA'],
            [''],
            ['Cliente:', clienteNome],
            clienteCNPJ ? ['CNPJ/CPF:', clienteCNPJ] : [],
            ['Data:', new Date().toLocaleDateString('pt-BR')],
            ['Volume Mensal:', formatCurrency(volumeTotal)],
            ['Contrato:', contractType === 'fidelity' ? 'Fidelidade 13 meses' : 'Adesão'],
            [''],
            ['Taxa', 'Stone', competitorName, 'Diferença'],
            ['Débito', `${stoneSimple.debit}%`, `${competitorSimple.debit}%`, `${(competitorSimple.debit - stoneSimple.debit).toFixed(2)}%`],
            ['Crédito 1x', `${stoneSimple.credit1x}%`, `${competitorSimple.credit1x}%`, `${(competitorSimple.credit1x - stoneSimple.credit1x).toFixed(2)}%`],
            ['2-6x', `${stoneSimple.credit2to6}%`, `${competitorSimple.credit2to6}%`, `${(competitorSimple.credit2to6 - stoneSimple.credit2to6).toFixed(2)}%`],
            ['7-12x', `${stoneSimple.credit7to12}%`, `${competitorSimple.credit7to12}%`, `${(competitorSimple.credit7to12 - stoneSimple.credit7to12).toFixed(2)}%`],
            ['PIX', `${stoneSimple.pix}%`, `${competitorSimple.pix}%`, `${(competitorSimple.pix - stoneSimple.pix).toFixed(2)}%`],
            [''],
            ['ECONOMIA MENSAL', formatCurrency(economy)],
            ['ECONOMIA ANUAL', formatCurrency(economy * 12)],
        ].filter(row => row.length > 0);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Comparativo');
        XLSX.writeFile(wb, `Proposta_${clienteNome.replace(/\s+/g, '_')}_Comparativo.xlsx`);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Comparação de Taxas</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Stone vs Concorrente</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Contract Toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 mr-2">
                        <button onClick={() => setContractType('fidelity')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${contractType === 'fidelity' ? 'bg-purple-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                            Fidelidade 13m
                        </button>
                        <button onClick={() => setContractType('adhesion')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${contractType === 'adhesion' ? 'bg-orange-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                            Adesão
                        </button>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                        <button onClick={() => setMode('simple')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'simple' ? 'bg-[#00A868] text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                            Simples
                        </button>
                        <button onClick={() => setMode('advanced')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'advanced' ? 'bg-[#00A868] text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                            Avançado
                        </button>
                    </div>
                    <button onClick={resetAll} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg">🔄 Limpar</button>
                    <button onClick={pullFromCET} className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 text-blue-600 dark:text-blue-300 text-xs rounded-lg">📡 Puxar CET</button>
                    <button onClick={exportPDF} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-300 text-xs rounded-lg">📄 PDF</button>
                    <button onClick={exportExcel} className="px-3 py-1.5 bg-green-100 hover:bg-green-200 dark:bg-green-500/20 dark:hover:bg-green-500/30 text-green-600 dark:text-green-300 text-xs rounded-lg">📊 Excel</button>
                </div>
            </div>

            {/* Volume + Share - Cards Grandes */}
            {mode === 'simple' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {/* TPV */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-2 shadow-sm">
                        <label className="text-[10px] text-slate-500">TPV Total</label>
                        <input type="number" value={volumeTotal} onChange={(e) => setVolumeTotal(Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white text-sm mt-1 focus:ring-1 focus:ring-[#00A868]" />
                        <div className="grid grid-cols-3 gap-1 mt-1">
                            <div>
                                <label className="text-[8px] text-slate-500">Déb</label>
                                <input type="number" value={volumeDebit} onChange={(e) => setVolumeDebit(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-600 dark:text-white text-[10px] text-center" />
                            </div>
                            <div>
                                <label className="text-[8px] text-slate-500">Créd</label>
                                <input type="number" value={volumeCredit} onChange={(e) => setVolumeCredit(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-600 dark:text-white text-[10px] text-center" />
                            </div>
                            <div>
                                <label className="text-[8px] text-slate-500">PIX</label>
                                <input type="number" value={volumePix} onChange={(e) => setVolumePix(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-600 dark:text-white text-[10px] text-center" />
                            </div>
                        </div>
                    </div>
                    {/* Share Débito */}
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-2 text-center flex flex-col justify-center">
                        <span className="text-blue-500 dark:text-blue-400 text-sm">💳</span>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{shares.debit.toFixed(0)}%</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Débito</p>
                    </div>
                    {/* Share Crédito */}
                    <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-lg p-2 text-center flex flex-col justify-center">
                        <span className="text-purple-500 dark:text-purple-400 text-sm">💎</span>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{shares.credit.toFixed(0)}%</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Crédito</p>
                    </div>
                    {/* Share PIX */}
                    <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 rounded-lg p-2 text-center flex flex-col justify-center">
                        <span className="text-cyan-500 dark:text-cyan-400 text-sm">⚡</span>
                        <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{shares.pix.toFixed(0)}%</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">PIX</p>
                    </div>
                </div>
            )}

            {/* Modo Avançado - Bandeiras + Volume Inline */}
            {mode === 'advanced' && (
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-2 space-y-2 shadow-sm">
                    {/* Bandeiras Toggle */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-slate-500">Bandeiras:</span>
                        {brandConfigs.map(config => (
                            <button key={config.name} onClick={() => toggleBrand(config.name)}
                                className={`px-2 py-0.5 text-[10px] rounded border ${config.enabled ? 'bg-[#00A868]/10 dark:bg-[#00A868]/20 border-[#00A868]/30 dark:border-[#00A868]/50 text-[#00A868]' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
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
                                <div key={config.name} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded p-1">
                                    <p className="text-[10px] font-medium truncate" style={{ color: brand?.color || '#00A868' }}>{config.name}</p>
                                    <div className="flex gap-1 mt-0.5">
                                        <input type="number" value={vol.debit} placeholder="D"
                                            onChange={(e) => setBrandVolumes({ ...brandVolumes, [config.name]: { ...vol, debit: Number(e.target.value) } })}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1 py-0.5 text-slate-700 dark:text-white text-[10px] text-center" />
                                        <input type="number" value={vol.credit} placeholder="C"
                                            onChange={(e) => setBrandVolumes({ ...brandVolumes, [config.name]: { ...vol, credit: Number(e.target.value) } })}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1 py-0.5 text-slate-700 dark:text-white text-[10px] text-center" />
                                    </div>
                                </div>
                            );
                        })}
                        {/* PIX */}
                        <div className="bg-cyan-50 dark:bg-slate-800/50 border border-cyan-200 dark:border-cyan-500/30 rounded p-1">
                            <p className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400">⚡ PIX</p>
                            <input type="number" value={pixVolume} onChange={(e) => setPixVolume(Number(e.target.value))}
                                className="w-full bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-500/30 rounded px-1 py-0.5 text-slate-700 dark:text-white text-[10px] text-center mt-0.5" />
                        </div>
                    </div>
                </div>
            )}

            {/* Tabela de Taxas - Containers Separados */}
            {mode === 'simple' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                    {/* Container Stone */}
                    <div className="bg-white dark:bg-slate-900/50 border border-[#00A868]/30 rounded-lg overflow-hidden shadow-sm">
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
                                <div key={row.key} className="flex items-center justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/50">
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{row.label}</span>
                                    <input type="number" step="0.01" value={stoneSimple[row.key as keyof BrandRates]}
                                        onChange={(e) => setStoneSimple({ ...stoneSimple, [row.key]: Number(e.target.value) })}
                                        className="w-16 bg-emerald-50 dark:bg-slate-800 border border-[#00A868]/30 rounded px-1 py-0.5 text-[#00A868] text-xs text-center font-medium" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Container Concorrente */}
                    <div className="bg-white dark:bg-slate-900/50 border border-red-500/30 rounded-lg overflow-hidden shadow-sm">
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
                                <div key={row.key} className="flex items-center justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/50">
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{row.label}</span>
                                    <input type="number" step="0.01" value={competitorSimple[row.key as keyof BrandRates]}
                                        onChange={(e) => setCompetitorSimple({ ...competitorSimple, [row.key]: Number(e.target.value) })}
                                        className="w-16 bg-red-50 dark:bg-slate-800 border border-red-500/30 rounded px-1 py-0.5 text-red-400 text-xs text-center font-medium" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Container Diferença */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                        <div className="bg-slate-100 dark:bg-slate-700 px-3 py-1.5">
                            <span className="text-slate-700 dark:text-white font-bold text-sm">Diferença</span>
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
                                    <div key={row.key} className="flex items-center justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/50">
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{row.label}</span>
                                        <span className={`text-xs font-bold ${diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : diff < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
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
                    <div key={config.name} className="border-b border-slate-200 dark:border-slate-700">
                        <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/30 text-xs font-semibold text-slate-700 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#00A868]"></span>
                            {config.name}
                        </div>
                        {['debit', 'credit1x', 'credit2to6', 'credit7to12', 'pix', 'rav'].map(key => {
                            const labels: Record<string, string> = { debit: 'Débito', credit1x: '1x', credit2to6: '2-6x', credit7to12: '7-12x', pix: 'PIX', rav: 'RAV' };
                            const stoneVal = stoneBrands[config.name]?.[key as keyof BrandRates] || 0;
                            const compVal = competitorBrands[config.name]?.[key as keyof BrandRates] || 0;
                            const diff = compVal - stoneVal;
                            return (
                                <div key={key} className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-800/30 items-center">
                                    <div className="px-3 py-1 text-xs text-slate-500 dark:text-slate-400 pl-6">{labels[key]}</div>
                                    <div className="px-2 py-0.5">
                                        <input type="number" step="0.01" value={stoneVal}
                                            onChange={(e) => setStoneBrands({ ...stoneBrands, [config.name]: { ...stoneBrands[config.name], [key]: Number(e.target.value) } })}
                                            className="w-full max-w-[55px] mx-auto block bg-white dark:bg-slate-800 border border-[#00A868]/30 rounded px-1 py-0.5 text-[#00A868] text-xs text-center" />
                                    </div>
                                    <div className="px-2 py-0.5">
                                        <input type="number" step="0.01" value={compVal}
                                            onChange={(e) => setCompetitorBrands({ ...competitorBrands, [config.name]: { ...competitorBrands[config.name], [key]: Number(e.target.value) } })}
                                            className="w-full max-w-[55px] mx-auto block bg-white dark:bg-slate-800 border border-red-500/30 rounded px-1 py-0.5 text-red-500 dark:text-red-400 text-xs text-center" />
                                    </div>
                                    <div className={`px-2 py-1 text-xs text-center font-bold ${diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : diff < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
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
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-linear-to-br dark:from-[#00A868]/20 dark:via-slate-900/80 dark:to-slate-900/90 border border-slate-200 dark:border-[#00A868]/40 dark:backdrop-blur-xl shadow-sm">
                    {/* Glow Effect (Dark only) */}
                    <div className="hidden dark:block absolute -top-20 -right-20 w-40 h-40 bg-[#00A868]/20 rounded-full blur-3xl" />

                    {/* Header */}
                    <div className="relative px-4 py-3 border-b border-slate-200 dark:border-[#00A868]/20 bg-slate-50 dark:bg-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00A868]/20 dark:bg-[#00A868]/30 flex items-center justify-center">
                                    <span className="text-lg">🖥️</span>
                                </div>
                                <div>
                                    <span className="text-slate-900 dark:text-white font-bold text-sm">Máquinas Stone</span>
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
                                className="px-3 py-1.5 bg-[#00A868]/10 hover:bg-[#00A868]/20 dark:bg-[#00A868]/30 dark:hover:bg-[#00A868]/50 border border-[#00A868]/30 dark:border-[#00A868]/50 rounded-lg text-[10px] text-[#00A868] font-medium transition-all hover:scale-105"
                            >
                                ⚡ Isenção por Volume
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Modelo</label>
                                <select value={stoneModelo} onChange={(e) => setStoneModelo(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600/50 rounded-lg px-2 py-2 text-slate-900 dark:text-white text-xs focus:border-[#00A868]/50 focus:ring-1 focus:ring-[#00A868]/30 transition-all">
                                    {STONE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Quantidade</label>
                                <input type="number" min="1" value={stoneQtdMaquinas} onChange={(e) => setStoneQtdMaquinas(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600/50 rounded-lg px-2 py-2 text-slate-900 dark:text-white text-xs text-center focus:border-[#00A868]/50 focus:ring-1 focus:ring-[#00A868]/30 transition-all" />
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
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-linear-to-br dark:from-red-500/10 dark:via-slate-900/80 dark:to-slate-900/90 border border-slate-200 dark:border-red-500/30 dark:backdrop-blur-xl shadow-sm">
                    {/* Glow Effect (Dark only) */}
                    <div className="hidden dark:block absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />

                    {/* Header */}
                    <div className="relative px-4 py-3 border-b border-slate-200 dark:border-red-500/20 bg-slate-50 dark:bg-transparent">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
                                <span className="text-lg">🖥️</span>
                            </div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white" style={{ color: competitor.color }}>Máquinas {competitorName}</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Quantidade</label>
                                <input type="number" min="1" value={competitorQtdMaquinas} onChange={(e) => setCompetitorQtdMaquinas(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600/50 rounded-lg px-2 py-2 text-slate-900 dark:text-white text-xs text-center focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Aluguel/mês (cada)</label>
                                <input type="number" step="0.01" value={competitorAluguel} onChange={(e) => setCompetitorAluguel(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-red-500/30 rounded-lg px-2 py-2 text-red-500 dark:text-red-400 text-xs text-center font-medium focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all" />
                            </div>
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/50">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Total Mensal:</span>
                            <span className="text-lg font-bold text-red-500 dark:text-red-400">{formatCurrency(competitorRentalCost)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resumo Final - Custos + Economia */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Stone Total */}
                    <div className="bg-[#00A868]/10 border border-[#00A868]/30 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-1">💎 Stone Total</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Taxas: {formatCurrency(stoneCosts.total)}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Aluguel: {formatCurrency(stoneRentalCost)}</p>
                        <p className="text-lg font-bold text-[#00A868]">{formatCurrency(totalStoneCost)}</p>
                    </div>

                    {/* Concorrente Total */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-1">{competitor.icon} {competitorName} Total</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Taxas: {formatCurrency(competitorCosts.total)}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Aluguel: {formatCurrency(competitorRentalCost)}</p>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(totalCompetitorCost)}</p>
                    </div>

                    {/* Economia */}
                    <div className={`rounded-lg p-2 text-center ${economy > 0 ? 'bg-[#00A868]/20 border border-[#00A868]/50' : economy < 0 ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600'}`}>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-1">💰 Economia Mensal</p>
                        {rentalEconomy !== 0 && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Aluguel: {rentalEconomy > 0 ? '+' : ''}{formatCurrency(rentalEconomy)}</p>
                        )}
                        <p className="text-2xl font-bold" style={{ color: economy > 0 ? '#00A868' : economy < 0 ? '#f59e0b' : '#94a3b8' }}>
                            {economy > 0 ? '+' : ''}{formatCurrency(economy)}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{economyPercent.toFixed(1)}% {economy > 0 ? 'mais barato' : economy < 0 ? 'mais caro' : 'igual'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
