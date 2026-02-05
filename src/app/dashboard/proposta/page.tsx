'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface CETData {
    ravRate: number;
    containers: Array<{ brand: string; debit: number; credit: { [key: string]: number } }>;
}

interface ComparativoData {
    volumeTotal: number;
    stone: { debit: number; credit1x: number; pix: number };
    competitor: { name: string; debit: number; credit1x: number; pix: number };
    economy: number;
    maquinas?: { stoneQtd: number; stoneAluguel: number; competitorQtd: number; competitorAluguel: number; isento: boolean };
}

export default function PropostaPage() {
    const [clienteCNPJ, setClienteCNPJ] = useState('');
    const [clienteNome, setClienteNome] = useState('');
    const [clienteTelefone, setClienteTelefone] = useState('');
    const [clienteEmail, setClienteEmail] = useState('');

    const [dadosCET, setDadosCET] = useState<CETData | null>(null);
    const [dadosComparativo, setDadosComparativo] = useState<ComparativoData | null>(null);

    const reloadData = () => {
        const cetData = localStorage.getItem('casa94_stone_rates');
        if (cetData) setDadosCET(JSON.parse(cetData));
        const compData = localStorage.getItem('casa94_comparativo');
        if (compData) setDadosComparativo(JSON.parse(compData));
    };

    useEffect(() => { reloadData(); }, []);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    // Header do cliente em cada página
    const addClienteHeader = (doc: jsPDF, pageTitle: string) => {
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header verde com "STONE" grande e centralizado
        doc.setFillColor(0, 168, 104);
        doc.rect(0, 0, pageWidth, 55, 'F');

        // Logo STONE centralizado e grande
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(36);
        doc.setFont('helvetica', 'bold');
        doc.text('STONE', pageWidth / 2, 22, { align: 'center' });

        // Subtítulo
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('PROPOSTA STONE', pageWidth / 2, 32, { align: 'center' });

        // Dados do cliente
        doc.setFontSize(9);
        doc.text(`Cliente: ${clienteNome || '-'}  |  CNPJ/CPF: ${clienteCNPJ || '-'}  |  Tel: ${clienteTelefone || '-'}`, pageWidth / 2, 42, { align: 'center' });

        // Data
        doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth / 2, 50, { align: 'center' });

        // Título da página (abaixo do header)
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(pageTitle, 14, 70);
    };

    // ===== PDF CET =====
    const gerarPDF_CET = () => {
        const doc = new jsPDF();
        addClienteHeader(doc, 'TAXAS STONE (CET)');

        doc.setTextColor(0, 0, 0);
        if (dadosCET && dadosCET.containers) {
            let yPos = 78;
            dadosCET.containers.forEach((container) => {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text(`Bandeira: ${container.brand}`, 14, yPos);

                const creditRows = Object.entries(container.credit || {}).map(([p, t]) => [`Crédito ${p}x`, `${t}%`]);
                autoTable(doc, {
                    startY: yPos + 3,
                    head: [['Tipo', 'Taxa']],
                    body: [['Débito', `${container.debit}%`], ...creditRows],
                    theme: 'grid',
                    headStyles: { fillColor: [0, 168, 104] },
                    margin: { left: 14, right: 14 },
                    styles: { fontSize: 9 },
                });
                yPos = (doc as any).lastAutoTable.finalY + 10;
            });
            doc.setFontSize(11);
            doc.text(`Taxa RAV: ${dadosCET.ravRate}%`, 14, yPos);
        } else {
            doc.setFontSize(11);
            doc.text('Configure as taxas na aba Calculador CET.', 14, 78);
        }
        doc.save(`CET_Stone_${clienteNome || 'Cliente'}.pdf`);
    };

    // ===== PDF COMPARATIVO =====
    const gerarPDF_Comparativo = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        addClienteHeader(doc, 'COMPARATIVO DE TAXAS');

        doc.setTextColor(0, 0, 0);
        if (dadosComparativo) {
            const cn = dadosComparativo.competitor?.name || 'Concorrente';

            autoTable(doc, {
                startY: 78,
                head: [['Taxa', 'Stone', cn, 'Economia']],
                body: [
                    ['Débito', `${dadosComparativo.stone?.debit}%`, `${dadosComparativo.competitor?.debit}%`,
                        `${((dadosComparativo.competitor?.debit || 0) - (dadosComparativo.stone?.debit || 0)).toFixed(2)}%`],
                    ['Crédito 1x', `${dadosComparativo.stone?.credit1x}%`, `${dadosComparativo.competitor?.credit1x}%`,
                        `${((dadosComparativo.competitor?.credit1x || 0) - (dadosComparativo.stone?.credit1x || 0)).toFixed(2)}%`],
                    ['PIX', `${dadosComparativo.stone?.pix}%`, `${dadosComparativo.competitor?.pix}%`,
                        `${((dadosComparativo.competitor?.pix || 0) - (dadosComparativo.stone?.pix || 0)).toFixed(2)}%`],
                ],
                theme: 'grid',
                headStyles: { fillColor: [0, 168, 104] },
            });

            let yPos = (doc as any).lastAutoTable.finalY + 12;

            // Máquinas
            if (dadosComparativo.maquinas) {
                const m = dadosComparativo.maquinas;
                autoTable(doc, {
                    startY: yPos,
                    head: [['Máquinas', 'Stone', cn]],
                    body: [
                        ['Quantidade', m.stoneQtd.toString(), m.competitorQtd.toString()],
                        ['Aluguel/mês', m.isento ? 'ISENTO' : formatCurrency(m.stoneAluguel * m.stoneQtd), formatCurrency(m.competitorAluguel * m.competitorQtd)],
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [0, 168, 104] },
                });
                yPos = (doc as any).lastAutoTable.finalY + 12;
            }

            // Economia destaque
            doc.setFillColor(0, 168, 104);
            doc.roundedRect(14, yPos, pageWidth - 28, 30, 3, 3, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.text('ECONOMIA MENSAL', pageWidth / 2, yPos + 10, { align: 'center' });
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(formatCurrency(dadosComparativo.economy || 0), pageWidth / 2, yPos + 24, { align: 'center' });
        } else {
            doc.setFontSize(11);
            doc.text('Configure na aba Comparação de Taxas.', 14, 55);
        }
        doc.save(`Comparativo_${clienteNome || 'Cliente'}.pdf`);
    };

    // ===== EXCEL CET =====
    const gerarExcel_CET = () => {
        const data: any[][] = [
            ['CASA 94 - STONE - TAXAS CET'],
            ['Cliente:', clienteNome, 'CNPJ/CPF:', clienteCNPJ],
            ['Telefone:', clienteTelefone, 'Data:', new Date().toLocaleDateString('pt-BR')],
            [''],
        ];
        if (dadosCET?.containers) {
            dadosCET.containers.forEach(c => {
                data.push([`Bandeira: ${c.brand}`], ['Tipo', 'Taxa'], ['Débito', `${c.debit}%`]);
                Object.entries(c.credit || {}).forEach(([p, t]) => data.push([`Crédito ${p}x`, `${t}%`]));
                data.push(['']);
            });
            data.push(['Taxa RAV', `${dadosCET.ravRate}%`]);
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'CET Stone');
        XLSX.writeFile(wb, `CET_Stone_${clienteNome || 'Cliente'}.xlsx`);
    };

    // ===== EXCEL COMPARATIVO =====
    const gerarExcel_Comparativo = () => {
        const cn = dadosComparativo?.competitor?.name || 'Concorrente';
        const data: any[][] = [
            ['CASA 94 - STONE - COMPARATIVO'],
            ['Cliente:', clienteNome, 'CNPJ/CPF:', clienteCNPJ],
            ['Telefone:', clienteTelefone, 'Data:', new Date().toLocaleDateString('pt-BR')],
            [''],
            ['Taxa', 'Stone', cn, 'Economia'],
        ];
        if (dadosComparativo) {
            data.push(['Débito', `${dadosComparativo.stone?.debit}%`, `${dadosComparativo.competitor?.debit}%`, `${((dadosComparativo.competitor?.debit || 0) - (dadosComparativo.stone?.debit || 0)).toFixed(2)}%`]);
            data.push(['Crédito 1x', `${dadosComparativo.stone?.credit1x}%`, `${dadosComparativo.competitor?.credit1x}%`, `${((dadosComparativo.competitor?.credit1x || 0) - (dadosComparativo.stone?.credit1x || 0)).toFixed(2)}%`]);
            data.push(['PIX', `${dadosComparativo.stone?.pix}%`, `${dadosComparativo.competitor?.pix}%`, `${((dadosComparativo.competitor?.pix || 0) - (dadosComparativo.stone?.pix || 0)).toFixed(2)}%`]);
            data.push(['']);
            if (dadosComparativo.maquinas) {
                const m = dadosComparativo.maquinas;
                data.push(['Máquinas', 'Stone', cn]);
                data.push(['Quantidade', m.stoneQtd, m.competitorQtd]);
                data.push(['Aluguel/mês', m.isento ? 'ISENTO' : m.stoneAluguel * m.stoneQtd, m.competitorAluguel * m.competitorQtd]);
                data.push(['']);
            }
            data.push(['ECONOMIA MENSAL', formatCurrency(dadosComparativo.economy || 0)]);
            data.push(['ECONOMIA ANUAL', formatCurrency((dadosComparativo.economy || 0) * 12)]);
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'Comparativo');
        XLSX.writeFile(wb, `Comparativo_${clienteNome || 'Cliente'}.xlsx`);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Nova Proposta</h1>
                    <p className="text-slate-400 text-sm">Preencha os dados e exporte PDF/Excel por página</p>
                </div>
                <button onClick={reloadData} className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm rounded-lg">
                    🔄 Atualizar Dados
                </button>
            </div>

            {/* Dados do Cliente */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <h2 className="text-white font-semibold text-sm mb-3">👤 Dados do Cliente</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">CNPJ / CPF</label>
                        <input type="text" value={clienteCNPJ} onChange={(e) => setClienteCNPJ(e.target.value)}
                            placeholder="00.000.000/0000-00" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Nome / Razão Social</label>
                        <input type="text" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)}
                            placeholder="Nome completo" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Telefone</label>
                        <input type="text" value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)}
                            placeholder="(00) 00000-0000" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Email</label>
                        <input type="email" value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)}
                            placeholder="email@empresa.com" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                    </div>
                </div>
            </div>

            {/* Cards de Exportação */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* CET */}
                <div className={`rounded-lg border p-4 ${dadosCET ? 'bg-[#00A868]/10 border-[#00A868]/30' : 'bg-slate-800/50 border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-white font-semibold">📊 CET Stone</h3>
                            <p className="text-xs text-slate-400">{dadosCET ? `${dadosCET.containers?.length || 0} bandeiras configuradas` : 'Não configurado'}</p>
                        </div>
                        {!dadosCET && <a href="/dashboard/cet" className="text-xs text-amber-400 hover:underline">Configurar →</a>}
                    </div>
                    {dadosCET && (
                        <div className="flex gap-2">
                            <button onClick={gerarPDF_CET} className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs rounded-lg">📄 PDF</button>
                            <button onClick={gerarExcel_CET} className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs rounded-lg">📊 Excel</button>
                        </div>
                    )}
                </div>

                {/* Comparativo */}
                <div className={`rounded-lg border p-4 ${dadosComparativo ? 'bg-[#00A868]/10 border-[#00A868]/30' : 'bg-slate-800/50 border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-white font-semibold">⚖️ Comparativo</h3>
                            <p className="text-xs text-slate-400">{dadosComparativo ? `Economia: ${formatCurrency(dadosComparativo.economy || 0)}/mês` : 'Não configurado'}</p>
                        </div>
                        {!dadosComparativo && <a href="/dashboard/comparativo" className="text-xs text-amber-400 hover:underline">Configurar →</a>}
                    </div>
                    {dadosComparativo && (
                        <div className="flex gap-2">
                            <button onClick={gerarPDF_Comparativo} className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs rounded-lg">📄 PDF</button>
                            <button onClick={gerarExcel_Comparativo} className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs rounded-lg">📊 Excel</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
