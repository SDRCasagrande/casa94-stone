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
    // Estado do Contrato
    const [contractType, setContractType] = useState<'fidelity' | 'adhesion'>('fidelity');

    // Carregar dados salvos ao iniciar (Mantido)
    useEffect(() => {
        const savedData = localStorage.getItem('casa94_stone_rates');
        if (savedData) {
            try {
                const { ravRate: savedRav, containers: savedContainers } = JSON.parse(savedData);
                if (savedRav !== undefined) setRavRate(savedRav);
                if (savedContainers && Array.isArray(savedContainers)) setContainers(savedContainers);
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            }
        }
        setIsLoaded(true);
    }, []);

    // Salva dados no localStorage sempre que mudarem
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('casa94_stone_rates', JSON.stringify({ ravRate, containers }));
        }
    }, [ravRate, containers, isLoaded]);

    // Função de Reset
    const resetForm = () => {
        if (confirm('Tem certeza que deseja resetar todos os dados? Isso limpará as personalizações atuais.')) {
            const defaultState = [{ id: Date.now().toString(), name: 'VISA/MASTER', debit: 0.84, credit1x: 1.86, credit2to6: 2.18, credit7to12: 2.41, credit13to18: 2.41 }];
            setRavRate(1.30);
            setContainers(defaultState);
            localStorage.removeItem('casa94_stone_rates');
        }
    };

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

    const inputClass = "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors";

    // Exportar PDF - Layout Profissional Adaptativo com Boxes
    const exportPDF = () => {
        const clienteNome = prompt('Nome da Empresa/Cliente:')?.trim();
        if (!clienteNome) return;
        const clienteCNPJ = prompt('CNPJ/CPF (opcional):')?.trim() || '';

        const doc = new jsPDF({ orientation: 'landscape' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Configuração Dinâmica baseada no número de itens
        const totalItems = containers.length;
        let cols = 1;
        let fontSizeTitle = 14;
        let fontSizeBody = 10;
        let fontSizeHead = 8;
        let cellPadding = 1.5;

        // Estratégia de Grid
        // 1-2 itens: 1 coluna (Layout original)
        // 3-4 itens: 2 colunas
        // 5-6 itens: 3 colunas
        // 7+ itens: 4 colunas (Modo Compacto Extremo)

        let gridCols = 1;
        if (totalItems > 2) gridCols = 2;
        if (totalItems > 4) gridCols = 3;
        if (totalItems > 8) gridCols = 4;

        // Ajuste de tamanhos baseado no Grid
        if (gridCols === 2) {
            fontSizeTitle = 11; fontSizeBody = 8; fontSizeHead = 7;
        } else if (gridCols >= 3) {
            fontSizeTitle = 9; fontSizeBody = 7; fontSizeHead = 6; cellPadding = 1;
        }

        const margin = 10;
        const availableWidth = pageWidth - (margin * 2);
        const colGap = 5;
        const colWidth = (availableWidth - ((gridCols - 1) * colGap)) / gridCols;

        // Header HEADER
        doc.setFillColor(0, 168, 104);
        doc.rect(0, 0, pageWidth, 40, 'F'); // Aumentei um pouco para 40

        // Título Centralizado
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('STONE', pageWidth / 2, 18, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('PROPOSTA DE TAXAS - CET', pageWidth / 2, 25, { align: 'center' });

        // Data e CNPJ nas pontas
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 10, 10, { align: 'right' });


        // === QUADRINHOS INFORMATIVOS (Abaixo do Header) ===
        const boxesY = 45;

        // Box 1: Taxa de Antecipação
        doc.setFillColor(240, 253, 244); // Fundo claro verde
        doc.setDrawColor(0, 168, 104); // Borda verde
        doc.rect(15, boxesY, 60, 22, 'FD');

        doc.setFontSize(8);
        doc.setTextColor(0, 168, 104);
        doc.setFont('helvetica', 'bold');
        doc.text('TAXA DE ANTECIPAÇÃO', 45, boxesY + 5, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(50, 50, 50);
        doc.text(`${ravRate.toFixed(2)}% ao mês`, 45, boxesY + 15, { align: 'center' });

        // Box 2: Regras de Contrato / Isenção
        doc.setFillColor(248, 250, 252); // Fundo cinza claro
        doc.setDrawColor(148, 163, 184); // Borda cinza
        doc.rect(80, boxesY, 130, 22, 'FD'); // Mais largo

        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'bold');

        const contractLabel = contractType === 'fidelity' ? 'FIDELIDADE 13 MESES' : 'TERMO DE ADESÃO';
        doc.text(contractLabel, 145, boxesY + 5, { align: 'center' });

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);

        if (contractType === 'fidelity') {
            doc.text('(Primeiro mês isento)', 145, boxesY + 9, { align: 'center' });
            doc.text(`Regra de Isenção por TPV:`, 145, boxesY + 14, { align: 'center' });
            doc.text(`10k(1 maq), 30k(2), 50k(4) e +2 maquinas a cada 50k adicionais.`, 145, boxesY + 18, { align: 'center' });
        } else {
            // Adesão
            doc.text('Valor: R$ 478,80', 145, boxesY + 9, { align: 'center' });
            doc.text('Isenção aplicada se houver mais de 1 máquina no termo de adesão.', 145, boxesY + 15, { align: 'center' });
            doc.text('Caso contrário, valor integral na primeira máquina.', 145, boxesY + 19, { align: 'center' });
        }

        // Nome do Cliente (abaixo dos boxes)
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`CLIENTE: ${clienteNome.toUpperCase()}`, margin, boxesY + 30);
        if (clienteCNPJ) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`CNPJ/CPF: ${clienteCNPJ}`, margin, boxesY + 35);
        }

        let startY = boxesY + 40; // Ajustado para baixo dos boxes
        let startX = margin;

        // Renderização em Grid
        containers.forEach((container, idx) => {
            const cetTable = getCETTable(container);

            // Calcular posição (Linha/Coluna)
            const colIndex = idx % gridCols;
            const rowIndex = Math.floor(idx / gridCols);

            // X position
            const currentX = margin + (colIndex * (colWidth + colGap));

            // Y position setup
            const rowHeight = (pageHeight - (boxesY + 50)) / Math.ceil(totalItems / gridCols); // Ajustado altura disponivel
            const currentY = startY + (rowIndex * rowHeight);

            // Nome da bandeira
            doc.setFontSize(fontSizeTitle);
            doc.setTextColor(0, 168, 104);
            doc.setFont('helvetica', 'bold');
            doc.text(container.name, currentX, currentY);

            // Tabela MDR
            autoTable(doc, {
                startY: currentY + 3,
                margin: { left: currentX },
                tableWidth: colWidth,
                head: [['Déb', 'Créd 1x', '2-6x', '7-12x', '13-18x']],
                body: [[
                    `${container.debit.toFixed(2)}%`,
                    `${container.credit1x.toFixed(2)}%`,
                    `${container.credit2to6.toFixed(2)}%`,
                    `${container.credit7to12.toFixed(2)}%`,
                    `${container.credit13to18.toFixed(2)}%`,
                ]],
                theme: 'grid',
                headStyles: { fillColor: [240, 240, 240], textColor: [80, 80, 80], fontSize: fontSizeHead, halign: 'center', cellPadding: cellPadding },
                bodyStyles: { fontSize: fontSizeBody, fontStyle: 'bold', halign: 'center', cellPadding: cellPadding },
                styles: { overflow: 'ellipsize' },
            });

            // Captura Y final do MDR
            let tableFinalY = (doc as any).lastAutoTable.finalY + 3;

            // Tabela CET compacta 3 colunas data
            const col1 = cetTable.slice(0, 6);
            const col2 = cetTable.slice(6, 12);
            const col3 = cetTable.slice(12, 18);

            // Se for muito pequeno, abreviar headers
            const headerRow = gridCols > 2
                ? ['P', 'CET', 'P', 'CET', 'P', 'CET']
                : ['Parc', 'CET', 'Parc', 'CET', 'Parc', 'CET'];

            autoTable(doc, {
                startY: tableFinalY,
                margin: { left: currentX },
                tableWidth: colWidth,
                head: [headerRow],
                body: col1.map((row, i) => [
                    `${row.parcelas}x`, `${row.cet.toFixed(2)}%`,
                    col2[i] ? `${col2[i].parcelas}x` : '', col2[i] ? `${col2[i].cet.toFixed(2)}%` : '',
                    col3[i] ? `${col3[i].parcelas}x` : '', col3[i] ? `${col3[i].cet.toFixed(2)}%` : '',
                ]),
                theme: 'grid',
                headStyles: { fillColor: [0, 168, 104], textColor: [255, 255, 255], fontSize: fontSizeHead, halign: 'center', cellPadding: cellPadding },
                bodyStyles: { fontSize: fontSizeBody, halign: 'center', cellPadding: cellPadding },
                columnStyles: {
                    0: { cellWidth: colWidth * 0.12 }, 1: { cellWidth: colWidth * 0.21, fontStyle: 'bold' },
                    2: { cellWidth: colWidth * 0.12 }, 3: { cellWidth: colWidth * 0.21, fontStyle: 'bold' },
                    4: { cellWidth: colWidth * 0.12 }, 5: { cellWidth: colWidth * 0.21, fontStyle: 'bold' },
                },
            });
        });

        // Info RAV e rodapé (Footer removido)
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        // doc.text('Proposta Stone - Válida... removido');

        doc.save(`Proposta_${clienteNome.replace(/\s+/g, '_')}_CET.pdf`);
    };

    // Exportar Excel - Layout Profissional (Atualizado com Contrato)
    const exportExcel = () => {
        // Prompt para dados do cliente
        const clienteNome = prompt('Nome da Empresa/Cliente:')?.trim();
        if (!clienteNome) return;
        const clienteCNPJ = prompt('CNPJ/CPF (opcional):')?.trim() || '';

        const wsData: (string | number)[][] = [
            ['STONE - PROPOSTA DE TAXAS (CET)'],
            [''],
            ['Cliente:', clienteNome],
            clienteCNPJ ? ['CNPJ/CPF:', clienteCNPJ] : [],
            ['Data:', new Date().toLocaleDateString('pt-BR')],
            ['Contrato:', contractType === 'fidelity' ? 'Fidelidade 13 meses' : 'Adesão'],
            ['RAV (Antecipação):', `${ravRate}%/mês`],
            [''],
        ].filter(row => row.length > 0);

        containers.forEach((container) => {
            const cetTable = getCETTable(container);

            wsData.push([container.name]);
            wsData.push(['Débito', 'Crédito 1x', '2-6x', '7-12x', '13-18x']);
            wsData.push([
                `${container.debit}%`,
                `${container.credit1x}%`,
                `${container.credit2to6}%`,
                `${container.credit7to12}%`,
                `${container.credit13to18}%`,
            ]);
            wsData.push(['']);
            wsData.push(['Parcelas', 'CET (%)']);
            cetTable.forEach(row => {
                wsData.push([`${row.parcelas}x`, `${row.cet.toFixed(2)}%`]);
            });
            wsData.push(['']);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Proposta CET');
        XLSX.writeFile(wb, `Proposta_${clienteNome.replace(/\s+/g, '_')}_CET.xlsx`);
    };

    if (!isLoaded) return null; // Evita hidratação incorreta

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Calculador de CET</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">CET = 1 - ((100 × (1 - MDR)) × (1 - (RAV × média_meses))) / 100</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Contract Toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 mr-2">
                        <button onClick={() => setContractType('fidelity')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${contractType === 'fidelity' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}>
                            Fidelidade
                        </button>
                        <button onClick={() => setContractType('adhesion')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${contractType === 'adhesion' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}>
                            Adesão
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 dark:text-slate-400">RAV (%/mês):</span>
                        <input
                            type="number"
                            step="0.01"
                            value={ravRate}
                            onChange={(e) => setRavRate(Number(e.target.value))}
                            className="w-24 bg-white dark:bg-slate-800 border border-emerald-500/50 rounded-lg px-3 py-2 text-emerald-600 dark:text-emerald-400 font-bold text-center transition-colors"
                        />
                    </div>
                    <button
                        onClick={addContainer}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all shadow-sm"
                    >
                        + Bandeira
                    </button>
                    <button
                        onClick={exportPDF}
                        className="px-4 py-2 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-300 font-medium rounded-xl transition-all flex items-center gap-2"
                    >
                        📄 PDF
                    </button>
                    <button
                        onClick={exportExcel}
                        className="px-4 py-2 bg-green-500/10 dark:bg-green-500/20 hover:bg-green-500/20 dark:hover:bg-green-500/30 text-green-600 dark:text-green-300 font-medium rounded-xl transition-all flex items-center gap-2"
                    >
                        📊 Excel
                    </button>
                    <button
                        onClick={resetForm}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
                    >
                        🗑️ Resetar
                    </button>
                </div>
            </div>

            {/* Containers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {containers.map((container) => {
                    const cetTable = getCETTable(container);

                    return (
                        <div key={container.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
                            {/* Header com seletor de bandeira */}
                            <div className="bg-linear-to-r from-emerald-600 to-emerald-500 p-4 flex items-center justify-between">
                                <select
                                    value={container.name}
                                    onChange={(e) => applyPreset(container.id, e.target.value)}
                                    className="bg-white/20 border-0 text-white font-bold text-lg rounded-lg px-3 py-1 focus:ring-2 focus:ring-white/50 placeholder-white"
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
                            <div className="p-4 space-y-3 border-b border-slate-200 dark:border-slate-800">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Débito</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={container.debit}
                                                onChange={(e) => updateContainer(container.id, 'debit', Number(e.target.value))}
                                                className={inputClass}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Crédito 1x</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={container.credit1x}
                                                onChange={(e) => updateContainer(container.id, 'credit1x', Number(e.target.value))}
                                                className={inputClass}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">2-6x</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={container.credit2to6}
                                                onChange={(e) => updateContainer(container.id, 'credit2to6', Number(e.target.value))}
                                                className={inputClass}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">7-12x</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={container.credit7to12}
                                                onChange={(e) => updateContainer(container.id, 'credit7to12', Number(e.target.value))}
                                                className={inputClass}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">13-18x</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={container.credit13to18}
                                                onChange={(e) => updateContainer(container.id, 'credit13to18', Number(e.target.value))}
                                                className={inputClass}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabela CET - 2 colunas */}
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Débito</span>
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{container.debit.toFixed(2)}%</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {/* Coluna 1: 1x-9x */}
                                    <div>
                                        <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-700 pb-1 mb-1">
                                            <span className="text-slate-500 dark:text-slate-400">Parc.</span>
                                            <span className="text-slate-500 dark:text-slate-400 text-right">CET</span>
                                        </div>
                                        {cetTable.slice(0, 9).map((row) => (
                                            <div key={row.parcelas} className="grid grid-cols-2 py-0.5 border-b border-slate-100 dark:border-slate-800/30">
                                                <span className="text-slate-700 dark:text-white">{row.parcelas}x</span>
                                                <span className={`text-right font-medium ${row.cet < 5 ? 'text-emerald-600 dark:text-emerald-400' : row.cet < 10 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {row.cet.toFixed(2)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Coluna 2: 10x-18x */}
                                    <div>
                                        <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-700 pb-1 mb-1">
                                            <span className="text-slate-500 dark:text-slate-400">Parc.</span>
                                            <span className="text-slate-500 dark:text-slate-400 text-right">CET</span>
                                        </div>
                                        {cetTable.slice(9, 18).map((row) => (
                                            <div key={row.parcelas} className="grid grid-cols-2 py-0.5 border-b border-slate-100 dark:border-slate-800/30">
                                                <span className="text-slate-700 dark:text-white">{row.parcelas}x</span>
                                                <span className={`text-right font-medium ${row.cet < 5 ? 'text-emerald-600 dark:text-emerald-400' : row.cet < 10 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
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
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
                <h3 className="text-sm font-medium text-slate-800 dark:text-white mb-3">📋 Legenda</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                        <span className="text-slate-600 dark:text-slate-400">CET &lt; 5%</span>
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500 dark:bg-amber-400"></span>
                        <span className="text-slate-600 dark:text-slate-400">5% ≤ CET &lt; 10%</span>
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-400"></span>
                        <span className="text-slate-600 dark:text-slate-400">CET ≥ 10%</span>
                    </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                    Fórmula: CET = MDR + (RAV × Parcelas) | RAV atual: {ravRate}%/mês
                </p>
            </div>
        </div>
    );
}
