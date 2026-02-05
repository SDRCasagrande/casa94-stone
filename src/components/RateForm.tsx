'use client';

import { useState } from 'react';
import {
    SimulationData,
    AcquirerRates,
    VolumeDistribution,
    DEFAULT_STONE_RATES,
    compareAcquirers,
    BrandRates,
} from '@/lib/calculator';

interface Props {
    onSubmit: (data: SimulationData) => void;
}

export function RateForm({ onSubmit }: Props) {
    const [clientName, setClientName] = useState('');
    const [simulationName, setSimulationName] = useState('');
    const [volumeMode, setVolumeMode] = useState<'simple' | 'detailed'>('simple');

    // Volume simples
    const [totalVolume, setTotalVolume] = useState(100000);
    const [debitPercent, setDebitPercent] = useState(30);
    const [credit1xPercent, setCredit1xPercent] = useState(20);
    const [credit2to6Percent, setCredit2to6Percent] = useState(30);
    const [credit7to12Percent, setCredit7to12Percent] = useState(15);
    const [credit13to18Percent, setCredit13to18Percent] = useState(0);
    const [pixPercent, setPixPercent] = useState(5);

    // Volume detalhado por bandeira
    const [visaDebit, setVisaDebit] = useState(0);
    const [visaCredit, setVisaCredit] = useState(0);
    const [masterDebit, setMasterDebit] = useState(0);
    const [masterCredit, setMasterCredit] = useState(0);
    const [eloDebit, setEloDebit] = useState(0);
    const [eloCredit, setEloCredit] = useState(0);
    const [pixVolume, setPixVolume] = useState(0);

    // Taxas Concorrente (atual)
    const [currentName, setCurrentName] = useState('Rede');
    const [currentRav, setCurrentRav] = useState(1.99);
    const [currentPix, setCurrentPix] = useState(0.59);
    const [currentAluguel, setCurrentAluguel] = useState(98.38);
    const [currentQtdMaquinas, setCurrentQtdMaquinas] = useState(16);
    // MDR por bandeira
    const [currentVisaDebit, setCurrentVisaDebit] = useState(0.69);
    const [currentVisaCredit, setCurrentVisaCredit] = useState(1.79);
    const [currentMasterDebit, setCurrentMasterDebit] = useState(0.69);
    const [currentMasterCredit, setCurrentMasterCredit] = useState(1.79);
    const [currentEloDebit, setCurrentEloDebit] = useState(0.99);
    const [currentEloCredit, setCurrentEloCredit] = useState(1.89);

    // Taxas Stone (proposta)
    const [proposedName, setProposedName] = useState('Stone');
    const [proposedRav, setProposedRav] = useState(1.30);
    const [proposedPix, setProposedPix] = useState(0.38);
    const [proposedAluguel, setProposedAluguel] = useState(79.90);
    const [proposedQtdMaquinas, setProposedQtdMaquinas] = useState(12);
    // MDR por bandeira
    const [proposedVisaDebit, setProposedVisaDebit] = useState(0.69);
    const [proposedVisaCredit, setProposedVisaCredit] = useState(1.79);
    const [proposedMasterDebit, setProposedMasterDebit] = useState(0.69);
    const [proposedMasterCredit, setProposedMasterCredit] = useState(1.79);
    const [proposedEloDebit, setProposedEloDebit] = useState(0.99);
    const [proposedEloCredit, setProposedEloCredit] = useState(1.89);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Calcula volume total se modo detalhado
        const calculatedTotal = volumeMode === 'detailed'
            ? visaDebit + visaCredit + masterDebit + masterCredit + eloDebit + eloCredit + pixVolume
            : totalVolume;

        const totalDebit = volumeMode === 'detailed' ? visaDebit + masterDebit + eloDebit : 0;
        const totalCredit = volumeMode === 'detailed' ? visaCredit + masterCredit + eloCredit : 0;

        const volume: VolumeDistribution = {
            total: calculatedTotal,
            debitPercent: volumeMode === 'detailed' && calculatedTotal > 0 ? (totalDebit / calculatedTotal) * 100 : debitPercent,
            credit1xPercent: volumeMode === 'detailed' && calculatedTotal > 0 ? (totalCredit / calculatedTotal) * 100 : credit1xPercent,
            credit2to6Percent: volumeMode === 'simple' ? credit2to6Percent : 0,
            credit7to12Percent: volumeMode === 'simple' ? credit7to12Percent : 0,
            credit13to18Percent: volumeMode === 'simple' ? credit13to18Percent : 0,
            pixPercent: volumeMode === 'detailed' && calculatedTotal > 0 ? (pixVolume / calculatedTotal) * 100 : pixPercent,
        };

        const makeBrandRates = (debit: number, credit: number): BrandRates => ({
            debit,
            credit1x: credit,
            credit2to6: credit,
            credit7to12: credit,
            credit13to18: credit,
        });

        const currentAcquirer: AcquirerRates = {
            name: currentName,
            visa: makeBrandRates(currentVisaDebit, currentVisaCredit),
            mastercard: makeBrandRates(currentMasterDebit, currentMasterCredit),
            elo: makeBrandRates(currentEloDebit, currentEloCredit),
            pix: currentPix,
            rav: currentRav,
            aluguelPorMaquina: currentAluguel,
            qtdMaquinas: currentQtdMaquinas,
        };

        const proposedAcquirer: AcquirerRates = {
            name: proposedName,
            visa: makeBrandRates(proposedVisaDebit, proposedVisaCredit),
            mastercard: makeBrandRates(proposedMasterDebit, proposedMasterCredit),
            elo: makeBrandRates(proposedEloDebit, proposedEloCredit),
            pix: proposedPix,
            rav: proposedRav,
            aluguelPorMaquina: proposedAluguel,
            qtdMaquinas: proposedQtdMaquinas,
        };

        const simulation: SimulationData = {
            name: simulationName || `Simulação ${new Date().toLocaleDateString('pt-BR')}`,
            clientName,
            currentAcquirer,
            proposedAcquirer,
            volume,
        };

        simulation.results = compareAcquirers(simulation);
        onSubmit(simulation);
    };

    const inputClass = "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    const labelClass = "block text-xs text-slate-400 mb-1";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Nome do Cliente</label>
                    <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex: Auto Posto Comaxin" className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Nome da Simulação</label>
                    <input type="text" value={simulationName} onChange={(e) => setSimulationName(e.target.value)} placeholder="Ex: Proposta Outubro" className={inputClass} />
                </div>
            </div>

            {/* Toggle Volume Mode */}
            <div className="flex gap-2">
                <button type="button" onClick={() => setVolumeMode('simple')} className={`px-4 py-2 rounded-lg text-sm ${volumeMode === 'simple' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                    Volume Simples (%)
                </button>
                <button type="button" onClick={() => setVolumeMode('detailed')} className={`px-4 py-2 rounded-lg text-sm ${volumeMode === 'detailed' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                    Volume por Bandeira (R$)
                </button>
            </div>

            {/* Volume Simples */}
            {volumeMode === 'simple' && (
                <div className="bg-slate-700/50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-slate-300 mb-3">📊 Volume Mensal</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-2">
                            <label className={labelClass}>Volume Total (R$)</label>
                            <input type="number" value={totalVolume} onChange={(e) => setTotalVolume(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Débito %</label>
                            <input type="number" value={debitPercent} onChange={(e) => setDebitPercent(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Crédito 1x %</label>
                            <input type="number" value={credit1xPercent} onChange={(e) => setCredit1xPercent(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Crédito 2-6x %</label>
                            <input type="number" value={credit2to6Percent} onChange={(e) => setCredit2to6Percent(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Crédito 7-12x %</label>
                            <input type="number" value={credit7to12Percent} onChange={(e) => setCredit7to12Percent(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Crédito 13-18x %</label>
                            <input type="number" value={credit13to18Percent} onChange={(e) => setCredit13to18Percent(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>PIX %</label>
                            <input type="number" value={pixPercent} onChange={(e) => setPixPercent(Number(e.target.value))} className={inputClass} />
                        </div>
                    </div>
                </div>
            )}

            {/* Volume Detalhado */}
            {volumeMode === 'detailed' && (
                <div className="bg-slate-700/50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-slate-300 mb-3">📊 TPV por Bandeira e Modalidade</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-600">
                                    <th className="text-left py-2 px-2 text-slate-400">Bandeira</th>
                                    <th className="text-right py-2 px-2 text-slate-400">Débito (R$)</th>
                                    <th className="text-right py-2 px-2 text-slate-400">Crédito (R$)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-slate-700/50">
                                    <td className="py-2 px-2">🔵 Visa</td>
                                    <td className="py-2 px-2"><input type="number" value={visaDebit} onChange={(e) => setVisaDebit(Number(e.target.value))} className={inputClass} /></td>
                                    <td className="py-2 px-2"><input type="number" value={visaCredit} onChange={(e) => setVisaCredit(Number(e.target.value))} className={inputClass} /></td>
                                </tr>
                                <tr className="border-b border-slate-700/50">
                                    <td className="py-2 px-2">🔴 Mastercard</td>
                                    <td className="py-2 px-2"><input type="number" value={masterDebit} onChange={(e) => setMasterDebit(Number(e.target.value))} className={inputClass} /></td>
                                    <td className="py-2 px-2"><input type="number" value={masterCredit} onChange={(e) => setMasterCredit(Number(e.target.value))} className={inputClass} /></td>
                                </tr>
                                <tr className="border-b border-slate-700/50">
                                    <td className="py-2 px-2">🟡 Elo</td>
                                    <td className="py-2 px-2"><input type="number" value={eloDebit} onChange={(e) => setEloDebit(Number(e.target.value))} className={inputClass} /></td>
                                    <td className="py-2 px-2"><input type="number" value={eloCredit} onChange={(e) => setEloCredit(Number(e.target.value))} className={inputClass} /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4">
                        <label className={labelClass}>📱 PIX (R$)</label>
                        <input type="number" value={pixVolume} onChange={(e) => setPixVolume(Number(e.target.value))} className={`${inputClass} max-w-xs`} />
                    </div>
                    <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                        <span className="text-sm text-slate-400">Total TPV: </span>
                        <span className="text-lg font-bold text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(visaDebit + visaCredit + masterDebit + masterCredit + eloDebit + eloCredit + pixVolume)}
                        </span>
                    </div>
                </div>
            )}

            {/* Taxas Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Concorrente */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-red-400 text-lg">🔴</span>
                        <input type="text" value={currentName} onChange={(e) => setCurrentName(e.target.value)} className="bg-transparent border-b border-red-500/50 text-red-300 font-bold text-lg focus:outline-none w-32" />
                        <span className="text-xs text-red-400">(Atual)</span>
                    </div>

                    {/* Taxas gerais */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className={labelClass}>RAV (Antecipação) %</label>
                            <input type="number" step="0.01" value={currentRav} onChange={(e) => setCurrentRav(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>PIX %</label>
                            <input type="number" step="0.01" value={currentPix} onChange={(e) => setCurrentPix(Number(e.target.value))} className={inputClass} />
                        </div>
                    </div>

                    {/* MDR por Bandeira */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                            <span></span>
                            <span className="text-center">Débito</span>
                            <span className="text-center">Crédito</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <span className="text-sm">Visa</span>
                            <input type="number" step="0.01" value={currentVisaDebit} onChange={(e) => setCurrentVisaDebit(Number(e.target.value))} className={inputClass} />
                            <input type="number" step="0.01" value={currentVisaCredit} onChange={(e) => setCurrentVisaCredit(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <span className="text-sm">Master</span>
                            <input type="number" step="0.01" value={currentMasterDebit} onChange={(e) => setCurrentMasterDebit(Number(e.target.value))} className={inputClass} />
                            <input type="number" step="0.01" value={currentMasterCredit} onChange={(e) => setCurrentMasterCredit(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <span className="text-sm">Elo</span>
                            <input type="number" step="0.01" value={currentEloDebit} onChange={(e) => setCurrentEloDebit(Number(e.target.value))} className={inputClass} />
                            <input type="number" step="0.01" value={currentEloCredit} onChange={(e) => setCurrentEloCredit(Number(e.target.value))} className={inputClass} />
                        </div>
                    </div>

                    {/* Aluguel */}
                    <div className="mt-4 pt-4 border-t border-red-500/20 grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Aluguel/Máquina (R$)</label>
                            <input type="number" step="0.01" value={currentAluguel} onChange={(e) => setCurrentAluguel(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Qtd Máquinas</label>
                            <input type="number" value={currentQtdMaquinas} onChange={(e) => setCurrentQtdMaquinas(Number(e.target.value))} className={inputClass} />
                        </div>
                    </div>
                </div>

                {/* Proposta (Stone) */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-emerald-400 text-lg">🟢</span>
                        <input type="text" value={proposedName} onChange={(e) => setProposedName(e.target.value)} className="bg-transparent border-b border-emerald-500/50 text-emerald-300 font-bold text-lg focus:outline-none w-32" />
                        <span className="text-xs text-emerald-400">(Proposta)</span>
                    </div>

                    {/* Taxas gerais */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className={labelClass}>RAV (Antecipação) %</label>
                            <input type="number" step="0.01" value={proposedRav} onChange={(e) => setProposedRav(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>PIX %</label>
                            <input type="number" step="0.01" value={proposedPix} onChange={(e) => setProposedPix(Number(e.target.value))} className={inputClass} />
                        </div>
                    </div>

                    {/* MDR por Bandeira */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                            <span></span>
                            <span className="text-center">Débito</span>
                            <span className="text-center">Crédito</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <span className="text-sm">Visa</span>
                            <input type="number" step="0.01" value={proposedVisaDebit} onChange={(e) => setProposedVisaDebit(Number(e.target.value))} className={inputClass} />
                            <input type="number" step="0.01" value={proposedVisaCredit} onChange={(e) => setProposedVisaCredit(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <span className="text-sm">Master</span>
                            <input type="number" step="0.01" value={proposedMasterDebit} onChange={(e) => setProposedMasterDebit(Number(e.target.value))} className={inputClass} />
                            <input type="number" step="0.01" value={proposedMasterCredit} onChange={(e) => setProposedMasterCredit(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <span className="text-sm">Elo</span>
                            <input type="number" step="0.01" value={proposedEloDebit} onChange={(e) => setProposedEloDebit(Number(e.target.value))} className={inputClass} />
                            <input type="number" step="0.01" value={proposedEloCredit} onChange={(e) => setProposedEloCredit(Number(e.target.value))} className={inputClass} />
                        </div>
                    </div>

                    {/* Aluguel */}
                    <div className="mt-4 pt-4 border-t border-emerald-500/20 grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Aluguel/Máquina (R$)</label>
                            <input type="number" step="0.01" value={proposedAluguel} onChange={(e) => setProposedAluguel(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Qtd Máquinas</label>
                            <input type="number" value={proposedQtdMaquinas} onChange={(e) => setProposedQtdMaquinas(Number(e.target.value))} className={inputClass} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit */}
            <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl">
                🧮 Calcular Comparativo
            </button>
        </form>
    );
}
