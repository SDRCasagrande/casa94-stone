'use client';

import { SimulationData, formatCurrency, formatPercent } from '@/lib/calculator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Props {
    simulation: SimulationData;
}

export function ExportButtons({ simulation }: Props) {
    const { results, currentAcquirer, proposedAcquirer, volume, clientName, name } = simulation;

    const exportPDF = () => {
        if (!results) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235);
        doc.text('Casa94 Stone', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('Comparativo de Taxas', pageWidth / 2, 28, { align: 'center' });

        // Info
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Cliente: ${clientName || 'Não informado'}`, 14, 40);
        doc.text(`Simulação: ${name}`, 14, 46);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 52);
        doc.text(`Volume Mensal (TPV): ${formatCurrency(volume.total)}`, 14, 58);

        // Economia
        doc.setFontSize(14);
        if (results.savings > 0) {
            doc.setTextColor(16, 185, 129);
            doc.text(`Economia Mensal: ${formatCurrency(results.savings)}`, 14, 70);
            doc.text(`Economia Anual: ${formatCurrency(results.savingsYearly)}`, 14, 78);
        } else {
            doc.setTextColor(239, 68, 68);
            doc.text(`Custo Adicional: ${formatCurrency(Math.abs(results.savings))}`, 14, 70);
        }

        // Tabela Comparativa
        const currentCredit = results.currentCost.credit1x + results.currentCost.credit2to6 + results.currentCost.credit7to12 + results.currentCost.credit13to18;
        const proposedCredit = results.proposedCost.credit1x + results.proposedCost.credit2to6 + results.proposedCost.credit7to12 + results.proposedCost.credit13to18;

        autoTable(doc, {
            startY: 90,
            head: [['Item', currentAcquirer.name, proposedAcquirer.name, 'Diferença']],
            body: [
                ['Taxa Débito', formatCurrency(results.currentCost.debit), formatCurrency(results.proposedCost.debit), formatCurrency(results.currentCost.debit - results.proposedCost.debit)],
                ['Taxa Crédito', formatCurrency(currentCredit), formatCurrency(proposedCredit), formatCurrency(currentCredit - proposedCredit)],
                ['Taxa PIX', formatCurrency(results.currentCost.pix), formatCurrency(results.proposedCost.pix), formatCurrency(results.currentCost.pix - results.proposedCost.pix)],
                ['Subtotal Taxas', formatCurrency(results.currentCost.subtotal), formatCurrency(results.proposedCost.subtotal), formatCurrency(results.currentCost.subtotal - results.proposedCost.subtotal)],
                ['Aluguel Máquinas', formatCurrency(results.currentCost.aluguel), formatCurrency(results.proposedCost.aluguel), formatCurrency(results.currentCost.aluguel - results.proposedCost.aluguel)],
                ['TOTAL MENSAL', formatCurrency(results.currentCost.total), formatCurrency(results.proposedCost.total), formatCurrency(results.savings)],
            ],
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] },
        });

        // Taxas MDR
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Taxas MDR - ${proposedAcquirer.name}`, 14, finalY);

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Bandeira', 'Débito', 'Crédito']],
            body: [
                ['VISA', `${proposedAcquirer.visa.debit}%`, `${proposedAcquirer.visa.credit1x}%`],
                ['Mastercard', `${proposedAcquirer.mastercard.debit}%`, `${proposedAcquirer.mastercard.credit1x}%`],
                ['Elo', `${proposedAcquirer.elo.debit}%`, `${proposedAcquirer.elo.credit1x}%`],
                ['PIX', `${proposedAcquirer.pix}%`, '-'],
                ['RAV (Antecipação)', `${proposedAcquirer.rav}%/mês`, '-'],
            ],
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] },
        });

        // CET Table
        const cetY = (doc as any).lastAutoTable.finalY + 10;
        doc.text('CET por Parcela', 14, cetY);

        const cetData = results.proposedCost.cetByInstallment.map((cet: number, i: number) => [`${i + 1}x`, formatPercent(cet)]);
        autoTable(doc, {
            startY: cetY + 5,
            head: [['Parcelas', 'CET']],
            body: cetData.slice(0, 12), // First 12
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 30 } },
        });

        // Footer
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Gerado por Casa94 Stone - Simulador de Taxas', pageWidth / 2, pageHeight - 10, { align: 'center' });

        doc.save(`comparativo_${clientName || 'cliente'}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportExcel = () => {
        if (!results) return;

        const currentCredit = results.currentCost.credit1x + results.currentCost.credit2to6 + results.currentCost.credit7to12 + results.currentCost.credit13to18;
        const proposedCredit = results.proposedCost.credit1x + results.proposedCost.credit2to6 + results.proposedCost.credit7to12 + results.proposedCost.credit13to18;

        const wsData = [
            ['Casa94 Stone - Comparativo de Taxas'],
            [''],
            ['Cliente:', clientName || 'Não informado'],
            ['Simulação:', name],
            ['Data:', new Date().toLocaleDateString('pt-BR')],
            ['Volume Mensal (TPV):', volume.total],
            [''],
            ['Economia Mensal:', results.savings],
            ['Economia Anual:', results.savingsYearly],
            [''],
            ['Comparativo de Custos'],
            ['Item', currentAcquirer.name, proposedAcquirer.name, 'Diferença'],
            ['Taxa Débito', results.currentCost.debit, results.proposedCost.debit, results.currentCost.debit - results.proposedCost.debit],
            ['Taxa Crédito', currentCredit, proposedCredit, currentCredit - proposedCredit],
            ['Taxa PIX', results.currentCost.pix, results.proposedCost.pix, results.currentCost.pix - results.proposedCost.pix],
            ['Subtotal Taxas', results.currentCost.subtotal, results.proposedCost.subtotal, results.currentCost.subtotal - results.proposedCost.subtotal],
            ['Aluguel Máquinas', results.currentCost.aluguel, results.proposedCost.aluguel, results.currentCost.aluguel - results.proposedCost.aluguel],
            ['TOTAL MENSAL', results.currentCost.total, results.proposedCost.total, results.savings],
            [''],
            [`Taxas MDR - ${proposedAcquirer.name}`],
            ['Bandeira', 'Débito', 'Crédito'],
            ['VISA', proposedAcquirer.visa.debit, proposedAcquirer.visa.credit1x],
            ['Mastercard', proposedAcquirer.mastercard.debit, proposedAcquirer.mastercard.credit1x],
            ['Elo', proposedAcquirer.elo.debit, proposedAcquirer.elo.credit1x],
            ['PIX', proposedAcquirer.pix, '-'],
            ['RAV (Antecipação)', proposedAcquirer.rav, '-'],
            [''],
            ['CET por Parcela'],
            ['Parcelas', ...Array.from({ length: 18 }, (_, i) => `${i + 1}x`)],
            ['CET (%)', ...results.proposedCost.cetByInstallment.map((c: number) => c.toFixed(2))],
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Comparativo');

        XLSX.writeFile(wb, `comparativo_${clientName || 'cliente'}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="flex gap-2">
            <button onClick={exportPDF} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm transition-colors">
                📄 PDF
            </button>
            <button onClick={exportExcel} className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg text-sm transition-colors">
                📊 Excel
            </button>
        </div>
    );
}
