'use client';

import { useState, useEffect } from 'react';

const STONE_MODELS = [
    { id: 'pos-smart', name: 'POS-Smart' },
    { id: 'gps-smart', name: 'GPS-Smart' },
    { id: 'stone-plus', name: 'Stone+' },
    { id: 'ton-t1', name: 'Ton T1' },
    { id: 'ton-t3', name: 'Ton T3' },
];

export default function PropostaPage() {
    // Dados do Cliente
    const [clienteCNPJ, setClienteCNPJ] = useState('');
    const [clienteNome, setClienteNome] = useState('');
    const [clienteTelefone, setClienteTelefone] = useState('');
    const [clienteEmail, setClienteEmail] = useState('');

    // Máquinas
    const [maquinas, setMaquinas] = useState([
        { modelo: 'pos-smart', quantidade: 1, aluguel: 0 }
    ]);

    // Acordo
    const [isencaoVolume, setIsencaoVolume] = useState(false);
    const [metaTransacional, setMetaTransacional] = useState(50000);
    const [fidelidade, setFidelidade] = useState(12); // meses

    // Dados vindos das calculadoras
    const [dadosCET, setDadosCET] = useState<any>(null);
    const [dadosComparativo, setDadosComparativo] = useState<any>(null);

    // Carregar dados do localStorage
    useEffect(() => {
        const cetData = localStorage.getItem('casa94_stone_rates');
        if (cetData) setDadosCET(JSON.parse(cetData));

        const compData = localStorage.getItem('casa94_comparativo');
        if (compData) setDadosComparativo(JSON.parse(compData));
    }, []);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const addMaquina = () => {
        setMaquinas([...maquinas, { modelo: 'pos-smart', quantidade: 1, aluguel: 0 }]);
    };

    const removeMaquina = (index: number) => {
        if (maquinas.length > 1) {
            setMaquinas(maquinas.filter((_, i) => i !== index));
        }
    };

    const updateMaquina = (index: number, field: string, value: any) => {
        const updated = [...maquinas];
        updated[index] = { ...updated[index], [field]: value };
        setMaquinas(updated);
    };

    const totalMaquinas = maquinas.reduce((acc, m) => acc + m.quantidade, 0);
    const totalAluguel = isencaoVolume ? 0 : maquinas.reduce((acc, m) => acc + (m.quantidade * m.aluguel), 0);

    const gerarPDF = () => {
        alert('🚧 Geração de PDF completo será implementada em breve!');
        // TODO: Gerar PDF com todos os dados
    };

    const salvarProposta = () => {
        const proposta = {
            cliente: { cnpj: clienteCNPJ, nome: clienteNome, telefone: clienteTelefone, email: clienteEmail },
            maquinas,
            acordo: { isencaoVolume, metaTransacional, fidelidade },
            dadosCET,
            dadosComparativo,
            criadoEm: new Date().toISOString(),
        };
        // TODO: Salvar no banco via API
        console.log('Proposta:', proposta);
        alert('✅ Proposta salva! (Em desenvolvimento)');
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white">Nova Proposta</h1>
                    <p className="text-slate-400 text-sm">Dados do cliente e acordo comercial</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={salvarProposta} className="px-4 py-2 bg-[#00A868] hover:bg-[#00A868]/80 text-white text-sm font-medium rounded-lg">
                        💾 Salvar
                    </button>
                    <button onClick={gerarPDF} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg">
                        📄 Gerar PDF
                    </button>
                </div>
            </div>

            {/* Dados do Cliente */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    👤 Dados do Cliente
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">CNPJ / CPF</label>
                        <input type="text" value={clienteCNPJ} onChange={(e) => setClienteCNPJ(e.target.value)}
                            placeholder="00.000.000/0000-00"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Razão Social / Nome</label>
                        <input type="text" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)}
                            placeholder="Nome completo"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Telefone</label>
                        <input type="text" value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)}
                            placeholder="(00) 00000-0000"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Email</label>
                        <input type="email" value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)}
                            placeholder="email@empresa.com"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                    </div>
                </div>
            </div>

            {/* Máquinas */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                        🖥️ Máquinas Stone
                    </h2>
                    <button onClick={addMaquina} className="px-3 py-1 bg-[#00A868]/20 hover:bg-[#00A868]/30 text-[#00A868] text-xs rounded-lg">
                        + Adicionar
                    </button>
                </div>

                <div className="space-y-2">
                    {maquinas.map((maq, index) => (
                        <div key={index} className="grid grid-cols-4 gap-2 items-end bg-slate-800/50 rounded-lg p-2">
                            <div>
                                <label className="text-[8px] text-slate-500">Modelo</label>
                                <select value={maq.modelo} onChange={(e) => updateMaquina(index, 'modelo', e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs">
                                    {STONE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[8px] text-slate-500">Quantidade</label>
                                <input type="number" min="1" value={maq.quantidade}
                                    onChange={(e) => updateMaquina(index, 'quantidade', Number(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs text-center" />
                            </div>
                            <div>
                                <label className="text-[8px] text-slate-500">Aluguel/mês (cada)</label>
                                <input type="number" step="0.01" value={maq.aluguel}
                                    onChange={(e) => updateMaquina(index, 'aluguel', Number(e.target.value))}
                                    className={`w-full bg-slate-800 border rounded px-2 py-1.5 text-xs text-center ${isencaoVolume ? 'border-amber-500/30 text-amber-400 line-through' : 'border-slate-700 text-white'}`}
                                    disabled={isencaoVolume} />
                            </div>
                            <div className="text-right">
                                {maquinas.length > 1 && (
                                    <button onClick={() => removeMaquina(index)} className="px-2 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded">
                                        🗑️
                                    </button>
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
                <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    📜 Acordo Comercial
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Isenção por Volume */}
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

                    {/* Meta Transacional */}
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Meta Transacional Mensal</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
                            <input type="number" value={metaTransacional} onChange={(e) => setMetaTransacional(Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded pl-10 pr-3 py-2 text-white text-sm" />
                        </div>
                    </div>

                    {/* Fidelidade */}
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

            {/* Resumo das Calculadoras */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Dados do CET */}
                <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-blue-400 font-semibold text-sm">📊 Dados do CET</h3>
                        <a href="/dashboard/cet" className="text-[10px] text-blue-400 hover:underline">Editar →</a>
                    </div>
                    {dadosCET ? (
                        <div className="text-xs text-slate-400">
                            <p>RAV: {dadosCET.ravRate}%</p>
                            <p>Containers: {dadosCET.containers?.length || 0}</p>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500">Nenhum dado. Configure no CET primeiro.</p>
                    )}
                </div>

                {/* Dados do Comparativo */}
                <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-purple-400 font-semibold text-sm">⚖️ Dados do Comparativo</h3>
                        <a href="/dashboard/comparativo" className="text-[10px] text-purple-400 hover:underline">Editar →</a>
                    </div>
                    {dadosComparativo ? (
                        <div className="text-xs text-slate-400">
                            <p>Economia: {formatCurrency(dadosComparativo.economy || 0)}</p>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500">Nenhum dado. Configure no Comparativo primeiro.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
