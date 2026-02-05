// Tipos para o simulador de taxas Casa94-Stone

export interface BrandRates {
    debit: number;        // Taxa débito %
    credit1x: number;     // Crédito à vista %
    credit2to6: number;   // Parcelado 2-6x %
    credit7to12: number;  // Parcelado 7-12x %
    credit13to18: number; // Parcelado 13-18x %
}

export interface AcquirerRates {
    name: string;
    visa: BrandRates;
    mastercard: BrandRates;
    elo: BrandRates;
    amex?: BrandRates;
    pix: number;
    rav: number; // Taxa de antecipação mensal %
    // Custos fixos
    aluguelPorMaquina?: number;
    qtdMaquinas?: number;
    mensalidade?: number;
    adesao?: number;
}

export interface VolumeDistribution {
    total: number;
    debitPercent: number;
    credit1xPercent: number;
    credit2to6Percent: number;
    credit7to12Percent: number;
    credit13to18Percent: number;
    pixPercent: number;
    // Distribuição por bandeira (opcional)
    visaPercent?: number;
    mastercardPercent?: number;
    eloPercent?: number;
}

export interface SimulationData {
    name: string;
    clientName?: string;
    currentAcquirer: AcquirerRates;
    proposedAcquirer: AcquirerRates;
    volume: VolumeDistribution;
    results?: SimulationResults;
}

export interface SimulationResults {
    currentCost: CostBreakdown;
    proposedCost: CostBreakdown;
    savings: number;
    savingsPercent: number;
    savingsYearly: number;
}

export interface CostBreakdown {
    debit: number;
    credit1x: number;
    credit2to6: number;
    credit7to12: number;
    credit13to18: number;
    pix: number;
    aluguel: number;
    mensalidade: number;
    subtotal: number; // Taxas
    total: number;    // Taxas + custos fixos
    cetByInstallment: number[]; // CET 1x até 18x
}

// Cálculo do CET (Custo Efetivo Total)
// Fórmula: CET = 1 - (((100 * (1 - MDR)) * (1 - (RAV * parcelas))) / 100)
export function calculateCET(mdr: number, rav: number, installments: number): number {
    const mdrDecimal = mdr / 100;
    const ravDecimal = rav / 100;
    const cet = 1 - (((100 * (1 - mdrDecimal)) * (1 - (ravDecimal * installments))) / 100);
    return cet * 100; // Retorna em %
}

// Calcula o custo mensal para uma modalidade com antecipação
export function calculateModalityCost(
    volume: number,
    mdr: number,
    rav: number,
    avgInstallments: number
): number {
    const cet = calculateCET(mdr, rav, avgInstallments);
    return (volume * cet) / 100;
}

// Calcula todos os custos para um adquirente
export function calculateAcquirerCosts(
    rates: AcquirerRates,
    volume: VolumeDistribution
): CostBreakdown {
    // Média das taxas por bandeira (simplificado)
    const avgDebit = (rates.visa.debit + rates.mastercard.debit + rates.elo.debit) / 3;
    const avgCredit1x = (rates.visa.credit1x + rates.mastercard.credit1x + rates.elo.credit1x) / 3;
    const avgCredit2to6 = (rates.visa.credit2to6 + rates.mastercard.credit2to6 + rates.elo.credit2to6) / 3;
    const avgCredit7to12 = (rates.visa.credit7to12 + rates.mastercard.credit7to12 + rates.elo.credit7to12) / 3;
    const avgCredit13to18 = (rates.visa.credit13to18 + rates.mastercard.credit13to18 + rates.elo.credit13to18) / 3;

    // Volume por modalidade
    const debitVolume = (volume.total * volume.debitPercent) / 100;
    const credit1xVolume = (volume.total * volume.credit1xPercent) / 100;
    const credit2to6Volume = (volume.total * volume.credit2to6Percent) / 100;
    const credit7to12Volume = (volume.total * volume.credit7to12Percent) / 100;
    const credit13to18Volume = (volume.total * (volume.credit13to18Percent || 0)) / 100;
    const pixVolume = (volume.total * volume.pixPercent) / 100;

    // Custos por modalidade
    const debit = (debitVolume * avgDebit) / 100;
    const credit1x = calculateModalityCost(credit1xVolume, avgCredit1x, rates.rav, 1);
    const credit2to6 = calculateModalityCost(credit2to6Volume, avgCredit2to6, rates.rav, 4);
    const credit7to12 = calculateModalityCost(credit7to12Volume, avgCredit7to12, rates.rav, 9);
    const credit13to18 = calculateModalityCost(credit13to18Volume, avgCredit13to18, rates.rav, 15);
    const pix = (pixVolume * rates.pix) / 100;

    // Custos fixos
    const aluguel = (rates.aluguelPorMaquina || 0) * (rates.qtdMaquinas || 0);
    const mensalidade = rates.mensalidade || 0;

    // CET por número de parcelas (1x a 18x)
    const cetByInstallment = Array.from({ length: 18 }, (_, i) => {
        const inst = i + 1;
        let mdr = avgCredit1x;
        if (inst >= 2 && inst <= 6) mdr = avgCredit2to6;
        if (inst >= 7 && inst <= 12) mdr = avgCredit7to12;
        if (inst >= 13) mdr = avgCredit13to18;
        return calculateCET(mdr, rates.rav, inst);
    });

    const subtotal = debit + credit1x + credit2to6 + credit7to12 + credit13to18 + pix;
    const total = subtotal + aluguel + mensalidade;

    return {
        debit,
        credit1x,
        credit2to6,
        credit7to12,
        credit13to18,
        pix,
        aluguel,
        mensalidade,
        subtotal,
        total,
        cetByInstallment,
    };
}

// Compara dois adquirentes
export function compareAcquirers(simulation: SimulationData): SimulationResults {
    const currentCost = calculateAcquirerCosts(simulation.currentAcquirer, simulation.volume);
    const proposedCost = calculateAcquirerCosts(simulation.proposedAcquirer, simulation.volume);

    const savings = currentCost.total - proposedCost.total;
    const savingsPercent = currentCost.total > 0 ? (savings / currentCost.total) * 100 : 0;

    return {
        currentCost,
        proposedCost,
        savings,
        savingsPercent,
        savingsYearly: savings * 12,
    };
}

// Dados padrão da Stone
export const DEFAULT_STONE_RATES: AcquirerRates = {
    name: 'Stone',
    visa: { debit: 0.84, credit1x: 1.86, credit2to6: 2.18, credit7to12: 2.41, credit13to18: 2.41 },
    mastercard: { debit: 0.84, credit1x: 1.86, credit2to6: 2.18, credit7to12: 2.41, credit13to18: 2.41 },
    elo: { debit: 1.19, credit1x: 2.28, credit2to6: 2.66, credit7to12: 2.98, credit13to18: 2.98 },
    pix: 0.75,
    rav: 1.30,
    aluguelPorMaquina: 0,
    qtdMaquinas: 0,
    mensalidade: 0,
};

// Template vazio para concorrente
export const EMPTY_RATES: AcquirerRates = {
    name: '',
    visa: { debit: 0, credit1x: 0, credit2to6: 0, credit7to12: 0, credit13to18: 0 },
    mastercard: { debit: 0, credit1x: 0, credit2to6: 0, credit7to12: 0, credit13to18: 0 },
    elo: { debit: 0, credit1x: 0, credit2to6: 0, credit7to12: 0, credit13to18: 0 },
    pix: 0,
    rav: 0,
    aluguelPorMaquina: 0,
    qtdMaquinas: 0,
    mensalidade: 0,
};

// Formatar moeda
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Formatar percentual
export function formatPercent(value: number): string {
    return `${value.toFixed(2)}%`;
}
