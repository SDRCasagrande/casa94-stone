'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const STONE_MODELS = [
    { id: 'pos-smart', name: 'POS-Smart' },
    { id: 'gps-smart', name: 'GPS-Smart' },
    { id: 'stone-plus', name: 'Stone+' },
    { id: 'ton-t1', name: 'Ton T1' },
    { id: 'ton-t3', name: 'Ton T3' },
];

interface CETData {
    ravRate: number;
    containers: Array<{ brand: string; debit: number; credit: { [key: string]: number } }>;
}

interface ComparativoData {
    volumeTotal: number;
    stone: { debit: number; credit1x: number; pix: number };
    competitor: { name: string; debit: number; credit1x: number; pix: number };
    economy: number;
}

export default function PropostaPage() {
    // Dados do Cliente
    const [clienteCNPJ, setClienteCNPJ] = useState('');
    const [clienteNome, setClienteNome] = useState('');
    const [clienteTelefone, setClienteTelefone] = useState('');
    const [clienteEmail, setClienteEmail] = useState('');
    const [clienteEndereco, setClienteEndereco] = useState('');

    // Máquinas
    const [maquinas, setMaquinas] = useState([{ modelo: 'pos-smart', quantidade: 1, aluguel: 0 }]);

    // Acordo
    const [isencaoVolume, setIsencaoVolume] = useState(false);
    const [metaTransacional, setMetaTransacional] = useState(50000);
    const [fidelidade, setFidelidade] = useState(12);

    // Dados das calculadoras
    const [dadosCET, setDadosCET] = useState<CETData | null>(null);
    const [dadosComparativo, setDadosComparativo] = useState<ComparativoData | null>(null);

    useEffect(() => {
        const cetData = localStorage.getItem('casa94_stone_rates');
        if (cetData) setDadosCET(JSON.parse(cetData));
        const compData = localStorage.getItem('casa94_comparativo');
        if (compData) setDadosComparativo(JSON.parse(compData));
    }, []);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const addMaquina = () => setMaquinas([...maquinas, { modelo: 'pos-smart', quantidade: 1, aluguel: 0 }]);
    const removeMaquina = (i: number) => maquinas.length > 1 && setMaquinas(maquinas.filter((_, idx) => idx !== i));
    const updateMaquina = (i: number, field: string, value: any) => {
        const updated = [...maquinas];
        updated[i] = { ...updated[i], [field]: value };
        setMaquinas(updated);
    };

    const totalMaquinas = maquinas.reduce((acc, m) => acc + m.quantidade, 0);
    const totalAluguel = isencaoVolume ? 0 : maquinas.reduce((acc, m) => acc + (m.quantidade * m.aluguel), 0);

    // Gerar PDF Completo
    const gerarPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(0, 168, 104);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('CASA 94 - STONE', 14, 22);
        doc.setFontSize(10);
        doc.text('Proposta Comercial', 14, 30);
        doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 14, 22, { align: 'right' });

        // Dados do Cliente
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

        // Página 2 - CET Stone
        doc.addPage();
        doc.setFillColor(0, 168, 104);
        doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('TAXAS STONE (CET)', 14, 17);

        doc.setTextColor(0, 0, 0);
        if (dadosCET && dadosCET.containers) {
            let yPos = 40;
            dadosCET.containers.forEach((container, idx) => {
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
                    body: [
                        ['Débito', `${container.debit}%`],
                        ...creditRows,
                    ],
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
            doc.text('Dados do CET não configurados. Configure na aba Calculador CET.', 14, 40);
        }

        // Página 3 - Comparativo
        doc.addPage();
        doc.setFillColor(0, 168, 104);
        doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('COMPARATIVO DE TAXAS', 14, 17);

        doc.setTextColor(0, 0, 0);
        if (dadosComparativo) {
            autoTable(doc, {
                startY: 40,
                head: [['Taxa', 'Stone', dadosComparativo.competitor?.name || 'Concorrente', 'Sua Economia']],
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

            const economyY = (doc as any).lastAutoTable.finalY + 20;
            doc.setFillColor(0, 168, 104);
            doc.roundedRect(14, economyY, pageWidth - 28, 30, 3, 3, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.text('ECONOMIA MENSAL ESTIMADA', pageWidth / 2, economyY + 12, { align: 'center' });
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(formatCurrency(dadosComparativo.economy || 0), pageWidth / 2, economyY + 24, { align: 'center' });
        } else {
            doc.setFontSize(11);
            doc.text('Dados do Comparativo não configurados. Configure na aba Comparação de Taxas.', 14, 40);
        }

        // Página 4 - Máquinas e Acordo
        doc.addPage();
        doc.setFillColor(0, 168, 104);
        doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('MÁQUINAS E ACORDO COMERCIAL', 14, 17);

        doc.setTextColor(0, 0, 0);
        const maqBody = maquinas.map(m => [
            STONE_MODELS.find(sm => sm.id === m.modelo)?.name || m.modelo,
            m.quantidade.toString(),
            isencaoVolume ? 'ISENTO' : formatCurrency(m.aluguel),
            isencaoVolume ? 'ISENTO' : formatCurrency(m.quantidade * m.aluguel)
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['Modelo', 'Qtd', 'Aluguel/un', 'Total']],
            body: maqBody,
            theme: 'grid',
            headStyles: { fillColor: [0, 168, 104] },
        });

        let acordoY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Acordo Comercial:', 14, acordoY);
        acordoY += 8;
        doc.setFont('helvetica', 'normal');
        doc.text(`• Fidelidade: ${fidelidade} meses`, 14, acordoY);
        acordoY += 7;
        if (isencaoVolume) {
            doc.text(`• Isenção de Aluguel: SIM (meta de ${formatCurrency(metaTransacional)}/mês)`, 14, acordoY);
            acordoY += 7;
            doc.setTextColor(0, 168, 104);
            doc.text(`✓ Aluguel ISENTO cumprindo o acordo de ${formatCurrency(metaTransacional)}`, 14, acordoY);
        } else {
            doc.text(`• Total Aluguel Mensal: ${formatCurrency(totalAluguel)}`, 14, acordoY);
        }

        // Footer
        doc.setTextColor(128, 128, 128);
        doc.setFontSize(8);
        doc.text('Proposta gerada por CASA 94 - Stone | Documento confidencial', pageWidth / 2, 285, { align: 'center' });

        doc.save(`Proposta_${clienteNome || 'Cliente'}_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    // Gerar Excel Completo
    const gerarExcel = () => {
        const wb = XLSX.utils.book_new();

        // Aba 1 - Dados do Cliente
        const clienteData = [
            ['PROPOSTA COMERCIAL STONE'],
            ['Data:', new Date().toLocaleDateString('pt-BR')],
            [''],
            ['DADOS DO CLIENTE'],
            ['CNPJ/CPF', clienteCNPJ],
            ['Razão Social/Nome', clienteNome],
            ['Telefone', clienteTelefone],
            ['Email', clienteEmail],
            ['Endereço', clienteEndereco],
        ];
        const wsCliente = XLSX.utils.aoa_to_sheet(clienteData);
        XLSX.utils.book_append_sheet(wb, wsCliente, 'Cliente');

        // Aba 2 - CET Stone
        const cetData: any[][] = [['TAXAS STONE (CET)'], ['']];
        if (dadosCET && dadosCET.containers) {
            dadosCET.containers.forEach(c => {
                cetData.push([`Bandeira: ${c.brand}`]);
                cetData.push(['Tipo', 'Taxa']);
                cetData.push(['Débito', `${c.debit}%`]);
                Object.entries(c.credit || {}).forEach(([p, t]) => {
                    cetData.push([`Crédito ${p}x`, `${t}%`]);
                });
                cetData.push(['']);
            });
            cetData.push(['Taxa RAV', `${dadosCET.ravRate}%`]);
        }
        const wsCET = XLSX.utils.aoa_to_sheet(cetData);
        XLSX.utils.book_append_sheet(wb, wsCET, 'CET Stone');

        // Aba 3 - Comparativo
        const compData: any[][] = [
            ['COMPARATIVO DE TAXAS'],
            [''],
            ['Taxa', 'Stone', dadosComparativo?.competitor?.name || 'Concorrente', 'Economia'],
        ];
        if (dadosComparativo) {
            compData.push(['Débito', `${dadosComparativo.stone?.debit}%`, `${dadosComparativo.competitor?.debit}%`,
                `${((dadosComparativo.competitor?.debit || 0) - (dadosComparativo.stone?.debit || 0)).toFixed(2)}%`]);
            compData.push(['Crédito 1x', `${dadosComparativo.stone?.credit1x}%`, `${dadosComparativo.competitor?.credit1x}%`,
                `${((dadosComparativo.competitor?.credit1x || 0) - (dadosComparativo.stone?.credit1x || 0)).toFixed(2)}%`]);
            compData.push(['PIX', `${dadosComparativo.stone?.pix}%`, `${dadosComparativo.competitor?.pix}%`,
                `${((dadosComparativo.competitor?.pix || 0) - (dadosComparativo.stone?.pix || 0)).toFixed(2)}%`]);
            compData.push(['']);
            compData.push(['ECONOMIA MENSAL', formatCurrency(dadosComparativo.economy || 0)]);
            compData.push(['ECONOMIA ANUAL', formatCurrency((dadosComparativo.economy || 0) * 12)]);
        }
        const wsComp = XLSX.utils.aoa_to_sheet(compData);
        XLSX.utils.book_append_sheet(wb, wsComp, 'Comparativo');

        // Aba 4 - Máquinas e Acordo
        const maqData: any[][] = [
            ['MÁQUINAS E ACORDO'],
            [''],
            ['Modelo', 'Quantidade', 'Aluguel/un', 'Total'],
        ];
        maquinas.forEach(m => {
            maqData.push([
                STONE_MODELS.find(sm => sm.id === m.modelo)?.name || m.modelo,
                m.quantidade,
                isencaoVolume ? 'ISENTO' : m.aluguel,
                isencaoVolume ? 'ISENTO' : m.quantidade * m.aluguel
            ]);
        });
        maqData.push(['']);
        maqData.push(['Total Máquinas', totalMaquinas]);
        maqData.push(['Total Aluguel/mês', isencaoVolume ? 'ISENTO' : formatCurrency(totalAluguel)]);
        maqData.push(['']);
        maqData.push(['ACORDO COMERCIAL']);
        maqData.push(['Fidelidade', `${fidelidade} meses`]);
        if (isencaoVolume) {
            maqData.push(['Isenção de Aluguel', 'SIM']);
            maqData.push(['Meta Transacional', formatCurrency(metaTransacional)]);
        }
        const wsMaq = XLSX.utils.aoa_to_sheet(maqData);
        XLSX.utils.book_append_sheet(wb, wsMaq, 'Máquinas e Acordo');

        XLSX.writeFile(wb, `Proposta_${clienteNome || 'Cliente'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Nova Proposta</h1>
                    <p className="text-slate-400 text-sm">Preencha os dados e gere o PDF/Excel completo</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={gerarPDF} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg flex items-center gap-2">
                        📄 Gerar PDF
                    </button>
                    <button onClick={gerarExcel} className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm rounded-lg flex items-center gap-2">
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
                            <span className="text-[10px] text-[#00A868]">✅ Configurado</span>
                        ) : (
                            <a href="/dashboard/cet" className="text-[10px] text-amber-400 hover:underline">⚠️ Configurar →</a>
                        )}
                    </div>
                </div>
                <div className={`p-3 rounded-lg border ${dadosComparativo ? 'bg-[#00A868]/10 border-[#00A868]/30' : 'bg-slate-800/50 border-slate-700'}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white">⚖️ Comparativo</span>
                        {dadosComparativo ? (
                            <span className="text-[10px] text-[#00A868]">✅ Configurado</span>
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

            {/* Máquinas */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-white font-semibold text-sm">🖥️ Máquinas Stone</h2>
                    <button onClick={addMaquina} className="px-3 py-1 bg-[#00A868]/20 hover:bg-[#00A868]/30 text-[#00A868] text-xs rounded-lg">+ Adicionar</button>
                </div>

                <div className="space-y-2">
                    {maquinas.map((m, i) => (
                        <div key={i} className="grid grid-cols-4 gap-2 items-end bg-slate-800/50 rounded-lg p-2">
                            <div>
                                <label className="text-[8px] text-slate-500">Modelo</label>
                                <select value={m.modelo} onChange={(e) => updateMaquina(i, 'modelo', e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs">
                                    {STONE_MODELS.map(sm => <option key={sm.id} value={sm.id}>{sm.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[8px] text-slate-500">Quantidade</label>
                                <input type="number" min="1" value={m.quantidade} onChange={(e) => updateMaquina(i, 'quantidade', Number(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs text-center" />
                            </div>
                            <div>
                                <label className="text-[8px] text-slate-500">Aluguel/mês</label>
                                <input type="number" step="0.01" value={m.aluguel} onChange={(e) => updateMaquina(i, 'aluguel', Number(e.target.value))}
                                    className={`w-full bg-slate-800 border rounded px-2 py-1.5 text-xs text-center ${isencaoVolume ? 'border-amber-500/30 text-amber-400 line-through' : 'border-slate-700 text-white'}`}
                                    disabled={isencaoVolume} />
                            </div>
                            <div className="text-right">
                                {maquinas.length > 1 && (
                                    <button onClick={() => removeMaquina(i)} className="px-2 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded">🗑️</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-700 pt-3">
                    <span className="text-sm text-slate-400">Total: {totalMaquinas} máquina(s)</span>
                    <span className={`text-sm font-bold ${isencaoVolume ? 'text-[#00A868]' : 'text-white'}`}>
                        {isencaoVolume ? '✅ ISENTO' : formatCurrency(totalAluguel) + '/mês'}
                    </span>
                </div>
            </div>

            {/* Acordo Comercial */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <h2 className="text-white font-semibold text-sm mb-3">📜 Acordo Comercial</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={isencaoVolume} onChange={(e) => setIsencaoVolume(e.target.checked)}
                                className="w-5 h-5 accent-[#00A868]" />
                            <div>
                                <span className="text-white text-sm block">Isenção de Aluguel</span>
                                <span className="text-[10px] text-slate-400">Por acordo de volume</span>
                            </div>
                        </label>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Meta Transacional Mensal</label>
                        <input type="number" value={metaTransacional} onChange={(e) => setMetaTransacional(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Período de Fidelidade</label>
                        <select value={fidelidade} onChange={(e) => setFidelidade(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm">
                            <option value={6}>6 meses</option>
                            <option value={12}>12 meses</option>
                            <option value={24}>24 meses</option>
                            <option value={36}>36 meses</option>
                        </select>
                    </div>
                </div>

                {isencaoVolume && (
                    <div className="mt-3 bg-[#00A868]/10 border border-[#00A868]/30 rounded-lg p-3">
                        <p className="text-[#00A868] text-sm">
                            ✅ <strong>Valor do aluguel ISENTO</strong> cumprindo o acordo de transacionar {formatCurrency(metaTransacional)}/mês
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
