'use client';

import { useState } from 'react';
import { RateForm } from '@/components/RateForm';
import { ResultsTable } from '@/components/ResultsTable';
import { ExportButtons } from '@/components/ExportButtons';
import { SimulationData } from '@/lib/calculator';

export default function ComparativoPage() {
    const [simulation, setSimulation] = useState<SimulationData | null>(null);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Comparação de Taxas</h1>
                <p className="text-slate-400">Compare taxas entre adquirentes e calcule a economia</p>
            </div>

            {/* Formulário */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <RateForm onSubmit={setSimulation} />
            </div>

            {/* Resultados */}
            {simulation && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-white">Resultado da Simulação</h2>
                            {simulation.clientName && (
                                <p className="text-slate-400">Cliente: {simulation.clientName}</p>
                            )}
                        </div>
                        <ExportButtons simulation={simulation} />
                    </div>
                    <ResultsTable simulation={simulation} />
                </div>
            )}
        </div>
    );
}
