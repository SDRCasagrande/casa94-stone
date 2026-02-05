'use client';

import { useState } from 'react';
import { RateForm } from '@/components/RateForm';
import { ResultsTable } from '@/components/ResultsTable';
import { ExportButtons } from '@/components/ExportButtons';
import { SimulationData, calculateCET } from '@/lib/calculator';

export default function Home() {
  const [simulation, setSimulation] = useState<SimulationData | null>(null);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Casa94 Stone
          </h1>
          <p className="text-slate-400 mt-2">Simulador de Taxas de Maquininhas</p>
        </header>

        {/* Formulário de Taxas */}
        <section className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
              📊
            </span>
            Configurar Taxas
          </h2>
          <RateForm onSubmit={setSimulation} />
        </section>

        {/* Resultados */}
        {simulation && (
          <>
            <section className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                    📋
                  </span>
                  Resultado da Simulação
                </h2>
                <ExportButtons simulation={simulation} />
              </div>
              <ResultsTable simulation={simulation} />
            </section>
          </>
        )}

        {/* Footer */}
        <footer className="text-center text-slate-500 text-sm mt-8">
          Casa94 Stone © {new Date().getFullYear()} - Uso interno
        </footer>
      </div>
    </main>
  );
}
