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
    // Dados do Cliente
    const [clienteCNPJ, setClienteCNPJ] = useState('');
    const [clienteNome, setClienteNome] = useState('');
    const [clienteTelefone, setClienteTelefone] = useState('');
    const [clienteEmail, setClienteEmail] = useState('');
    const [clienteEndereco, setClienteEndereco] = useState('');

    // Dados das calculadoras
    const [dadosCET, setDadosCET] = useState<CETData | null>(null);
    const [dadosComparativo, setDadosComparativo] = useState<ComparativoData | null>(null);

    // Recarregar dados
    const reloadData = () => {
        const cetData = localStorage.getItem('casa94_stone_rates');
        if (cetData) setDadosCET(JSON.parse(cetData));
        const compData = localStorage.getItem('casa94_comparativo');
        if (compData) setDadosComparativo(JSON.parse(compData));
    };

    useEffect(() => {
        reloadData();
    }, []);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    // Gerar PDF - 3 páginas
    const gerarPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // ===== PÁGINA 1: DADOS DO CLIENTE =====
        doc.setFillColor(0, 168, 104);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('CASA 94 - STONE', 14, 22);
        doc.setFontSize(10);
        doc.text('Proposta Comercial', 14, 30);
        doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 14, 22, { align: 'right' });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('DADOS DO CLIENTE', 14, 50);

        autoTable(doc, {
            startY: 55,
            head: [['Campo', 'Valor']],
            body: [
                ['CNPJ/CPF', clienteCNPJ || '-'],
                ['Razão Social/Nome', clienteNome || '-'],
                ['Telefone', clienteTelefone || '-'],
                ['Email', clienteEmail || '-'],
                ['Endereço', clienteEndereco || '-'],
            ],
            theme: 'striped',
            headStyles: { fillColor: [0, 168, 104] },
        });

        // ===== PÁGINA 2: CET STONE =====
        doc.addPage();
        doc.setFillColor(0, 168, 104);
        doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('TAXAS STONE (CET)', 14, 17);

        doc.setTextColor(0, 0, 0);
        if (dadosCET && dadosCET.containers) {
            let yPos = 40;
            dadosCET.containers.forEach((container) => {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`Bandeira: ${container.brand}`, 14, yPos);
                yPos += 8;

                const creditRows = Object.entries(container.credit || {}).map(([parcela, taxa]) => [
                    `Crédito ${parcela}x`, `${taxa}%`
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [['Tipo', 'Taxa']],
                    body: [['Débito', `${container.debit}%`], ...creditRows],
                    theme: 'grid',
                    headStyles: { fillColor: [0, 168, 104] },
                    margin: { left: 14, right: 14 },
                });
                yPos = (doc as any).lastAutoTable.finalY + 15;
            });
            doc.setFontSize(12);
            doc.text(`Taxa RAV: ${dadosCET.ravRate}%`, 14, yPos);
        } else {
            doc.setFontSize(11);
            doc.text('Dados do CET não configurados.', 14, 40);
        }

        // ===== PÁGINA 3: COMPARATIVO =====
        doc.addPage();
        doc.setFillColor(0, 168, 104);
        doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('COMPARATIVO DE TAXAS', 14, 17);

        doc.setTextColor(0, 0, 0);
        if (dadosComparativo) {
            const compName = dadosComparativo.competitor?.name || 'Concorrente';

            // Taxas
            autoTable(doc, {
                startY: 40,
                head: [['Taxa', 'Stone', compName, 'Economia']],
                body: [
                    ['Débito', `${dadosComparativo.stone?.debit || 0}%`, `${dadosComparativo.competitor?.debit || 0}%`,
                        `${((dadosComparativo.competitor?.debit || 0) - (dadosComparativo.stone?.debit || 0)).toFixed(2)}%`],
                    ['Crédito 1x', `${dadosComparativo.stone?.credit1x || 0}%`, `${dadosComparativo.competitor?.credit1x || 0}%`,
                        `${((dadosComparativo.competitor?.credit1x || 0) - (dadosComparativo.stone?.credit1x || 0)).toFixed(2)}%`],
                    ['PIX', `${dadosComparativo.stone?.pix || 0}%`, `${dadosComparativo.competitor?.pix || 0}%`,
                        `${((dadosComparativo.competitor?.pix || 0) - (dadosComparativo.stone?.pix || 0)).toFixed(2)}%`],
                ],
                theme: 'grid',
                headStyles: { fillColor: [0, 168, 104] },
            });

            // Máquinas (se existir)
            let yAfterTaxas = (doc as any).lastAutoTable.finalY + 15;
            if (dadosComparativo.maquinas) {
                const m = dadosComparativo.maquinas;
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('MÁQUINAS:', 14, yAfterTaxas);

                autoTable(doc, {
                    startY: yAfterTaxas + 5,
                    head: [['', 'Stone', compName]],
                    body: [
                        ['Quantidade', m.stoneQtd.toString(), m.competitorQtd.toString()],
                        ['Aluguel/mês', m.isento ? 'ISENTO' : formatCurrency(m.stoneAluguel * m.stoneQtd), formatCurrency(m.competitorAluguel * m.competitorQtd)],
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [0, 168, 104] },
                });
                yAfterTaxas = (doc as any).lastAutoTable.finalY + 15;
            }

            // Economia
            doc.setFillColor(0, 168, 104);
            doc.roundedRect(14, yAfterTaxas, pageWidth - 28, 35, 3, 3, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.text('ECONOMIA MENSAL', pageWidth / 2, yAfterTaxas + 12, { align: 'center' });
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(formatCurrency(dadosComparativo.economy || 0), pageWidth / 2, yAfterTaxas + 27, { align: 'center' });
        } else {
            doc.setFontSize(11);
            doc.text('Dados do Comparativo não configurados.', 14, 40);
        }

        // Footer
        doc.setTextColor(128, 128, 128);
        doc.setFontSize(8);
        doc.text('Proposta gerada por CASA 94 - Stone', pageWidth / 2, 285, { align: 'center' });

        doc.save(`Proposta_${clienteNome || 'Cliente'}_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    // Gerar Excel - 3 abas
    const gerarExcel = () => {
        const wb = XLSX.utils.book_new();

        // Aba 1 - Cliente
        const wsCliente = XLSX.utils.aoa_to_sheet([
            ['PROPOSTA COMERCIAL STONE'],
            ['Data:', new Date().toLocaleDateString('pt-BR')],
            [''],
            ['DADOS DO CLIENTE'],
            ['CNPJ/CPF', clienteCNPJ],
            ['Razão Social', clienteNome],
            ['Telefone', clienteTelefone],
            ['Email', clienteEmail],
            ['Endereço', clienteEndereco],
        ]);
        XLSX.utils.book_append_sheet(wb, wsCliente, 'Cliente');

        // Aba 2 - CET
        const cetData: any[][] = [['TAXAS STONE (CET)'], ['']];
        if (dadosCET?.containers) {
            dadosCET.containers.forEach(c => {
                cetData.push([`Bandeira: ${c.brand}`]);
                cetData.push(['Tipo', 'Taxa']);
                cetData.push(['Débito', `${c.debit}%`]);
                Object.entries(c.credit || {}).forEach(([p, t]) => cetData.push([`Crédito ${p}x`, `${t}%`]));
                cetData.push(['']);
            });
            cetData.push(['Taxa RAV', `${dadosCET.ravRate}%`]);
        }
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cetData), 'CET Stone');

        // Aba 3 - Comparativo
        const compData: any[][] = [['COMPARATIVO DE TAXAS'], ['']];
        if (dadosComparativo) {
            const cn = dadosComparativo.competitor?.name || 'Concorrente';
            compData.push(['Taxa', 'Stone', cn, 'Economia']);
            compData.push(['Débito', `${dadosComparativo.stone?.debit}%`, `${dadosComparativo.competitor?.debit}%`, `${((dadosComparativo.competitor?.debit || 0) - (dadosComparativo.stone?.debit || 0)).toFixed(2)}%`]);
            compData.push(['Crédito 1x', `${dadosComparativo.stone?.credit1x}%`, `${dadosComparativo.competitor?.credit1x}%`, `${((dadosComparativo.competitor?.credit1x || 0) - (dadosComparativo.stone?.credit1x || 0)).toFixed(2)}%`]);
            compData.push(['PIX', `${dadosComparativo.stone?.pix}%`, `${dadosComparativo.competitor?.pix}%`, `${((dadosComparativo.competitor?.pix || 0) - (dadosComparativo.stone?.pix || 0)).toFixed(2)}%`]);
            compData.push(['']);
            if (dadosComparativo.maquinas) {
                const m = dadosComparativo.maquinas;
                compData.push(['MÁQUINAS', 'Stone', cn]);
                compData.push(['Quantidade', m.stoneQtd, m.competitorQtd]);
                compData.push(['Aluguel/mês', m.isento ? 'ISENTO' : m.stoneAluguel * m.stoneQtd, m.competitorAluguel * m.competitorQtd]);
                compData.push(['']);
            }
            compData.push(['ECONOMIA MENSAL', formatCurrency(dadosComparativo.economy || 0)]);
            compData.push(['ECONOMIA ANUAL', formatCurrency((dadosComparativo.economy || 0) * 12)]);
        }
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(compData), 'Comparativo');

        XLSX.writeFile(wb, `Proposta_${clienteNome || 'Cliente'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Nova Proposta</h1>
                    <p className="text-slate-400 text-sm">Preencha os dados do cliente e gere o PDF/Excel</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={reloadData} className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm rounded-lg">
                        🔄 Atualizar Dados
                    </button>
                    <button onClick={gerarPDF} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg">
                        📄 Gerar PDF
                    </button>
                    <button onClick={gerarExcel} className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm rounded-lg">
                        📊 Gerar Excel
                    </button>
                </div>
            </div>

            {/* Status das Calculadoras */}
            <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border ${dadosCET ? 'bg-[#00A868]/10 border-[#00A868]/30' : 'bg-slate-800/50 border-slate-700'}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white">📊 CET Stone</span>
                        {dadosCET ? (
                            <span className="text-[10px] text-[#00A868]">✅ {dadosCET.containers?.length || 0} bandeiras</span>
                        ) : (
                            <a href="/dashboard/cet" className="text-[10px] text-amber-400 hover:underline">⚠️ Configurar →</a>
                        )}
                    </div>
                </div>
                <div className={`p-3 rounded-lg border ${dadosComparativo ? 'bg-[#00A868]/10 border-[#00A868]/30' : 'bg-slate-800/50 border-slate-700'}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white">⚖️ Comparativo</span>
                        {dadosComparativo ? (
                            <span className="text-[10px] text-[#00A868]">✅ Economia: {formatCurrency(dadosComparativo.economy || 0)}</span>
                        ) : (
                            <a href="/dashboard/comparativo" className="text-[10px] text-amber-400 hover:underline">⚠️ Configurar →</a>
                        )}
                    </div>
                </div>
            </div>

            {/* Dados do Cliente */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <h2 className="text-white font-semibold text-sm mb-3">👤 Dados do Cliente</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">CNPJ / CPF</label>
                        <input type="text" value={clienteCNPJ} onChange={(e) => setClienteCNPJ(e.target.value)}
                            placeholder="00.000.000/0000-00" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Razão Social / Nome</label>
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
                    <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-500 block mb-1">Endereço</label>
                        <input type="text" value={clienteEndereco} onChange={(e) => setClienteEndereco(e.target.value)}
                            placeholder="Rua, número, bairro, cidade" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                    </div>
                </div>
            </div>

            {/* Preview dos dados */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <h2 className="text-white font-semibold text-sm mb-3">📋 Preview da Proposta</h2>
                <div className="text-xs text-slate-400 space-y-1">
                    <p>• <strong>Página 1:</strong> Dados do Cliente</p>
                    <p>• <strong>Página 2:</strong> CET Stone ({dadosCET?.containers?.length || 0} bandeiras, RAV {dadosCET?.ravRate || 0}%)</p>
                    <p>• <strong>Página 3:</strong> Comparativo (Economia de {formatCurrency(dadosComparativo?.economy || 0)}/mês)</p>
                </div>
            </div>
        </div>
    );
}
