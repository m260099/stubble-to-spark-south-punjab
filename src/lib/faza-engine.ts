/**
 * FAZA Deterministic Rules Engine.
 * Pure functions only: every rupee and every ton is computed here in plain code.
 * The LLM never touches these numbers.
 */

/** Average rice stubble yield in South Punjab (tons per acre). */
export const STUBBLE_TONS_PER_ACRE = 2.5;
/** Tons of CO2 released when one ton of rice straw is burned in the open. */
export const CO2_TONS_PER_TON_STUBBLE = 1.46;
/** Deadlines at or below this many days force rush shipping. */
export const RUSH_DEADLINE_DAYS = 1;
/** Rush shipping multiplier applied to the transport quote. */
export const RUSH_MULTIPLIER = 1.5;
/** Maximum the Clean Air pool will pay towards a single deal (PKR). */
export const MAX_SUBSIDY_PER_DEAL = 50000;
/** Starting balance of the Clean Air Subsidy Pool (PKR). */
export const INITIAL_POOL_BALANCE = 500000;

export interface NegotiationInput {
  farmerName: string;
  farmerLocation: string;
  acres: number;
  deadlineDays: number;
  biomassPrice: number;
  tonsNeeded: number;
  factoryBudget: number;
  transportCost: number;
  poolBalance: number;
}

export type Verdict = "APPROVED_NO_SUBSIDY" | "APPROVED_WITH_SUBSIDY" | "FAILED_CAP" | "FAILED_POOL";

export interface NegotiationResult {
  // Stage 1
  farmerTons: number;
  contractedTons: number;
  surplusTons: number;
  farmerPayout: number;
  // Stage 2
  isRush: boolean;
  effectiveTransportCost: number;
  // Stage 3
  deficit: number;
  // Stage 4
  verdict: Verdict;
  approved: boolean;
  subsidy: number;
  newPoolBalance: number;
  co2PreventedTons: number;
  co2AtRiskTons: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const safe = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function runRulesEngine(input: NegotiationInput): NegotiationResult {
  const acres = safe(input.acres);
  const price = safe(input.biomassPrice);
  const tonsNeeded = safe(input.tonsNeeded);
  const budget = safe(input.factoryBudget);
  const transport = safe(input.transportCost);
  const pool = safe(input.poolBalance);
  const deadline = Number.isFinite(input.deadlineDays) ? input.deadlineDays : 0;

  // Stage 1: Asset valuation
  const farmerTons = round2(acres * STUBBLE_TONS_PER_ACRE);
  const contractedTons = round2(Math.min(farmerTons, tonsNeeded));
  const surplusTons = round2(farmerTons - contractedTons);
  const farmerPayout = Math.round(contractedTons * price);

  // Stage 2: Logistics analysis
  const isRush = deadline <= RUSH_DEADLINE_DAYS;
  const effectiveTransportCost = Math.round(isRush ? transport * RUSH_MULTIPLIER : transport);

  // Stage 3: Budget conflict
  const deficit = Math.max(0, effectiveTransportCost - budget);

  // Stage 4: Resolution
  let verdict: Verdict;
  let subsidy = 0;
  if (deficit === 0) {
    verdict = "APPROVED_NO_SUBSIDY";
  } else if (deficit > MAX_SUBSIDY_PER_DEAL) {
    verdict = "FAILED_CAP";
  } else if (deficit > pool) {
    verdict = "FAILED_POOL";
  } else {
    verdict = "APPROVED_WITH_SUBSIDY";
    subsidy = deficit;
  }
  const approved = verdict === "APPROVED_NO_SUBSIDY" || verdict === "APPROVED_WITH_SUBSIDY";
  const newPoolBalance = pool - subsidy;

  const co2PreventedTons = approved ? round2(contractedTons * CO2_TONS_PER_TON_STUBBLE) : 0;
  const co2AtRiskTons = approved
    ? round2(surplusTons * CO2_TONS_PER_TON_STUBBLE)
    : round2(farmerTons * CO2_TONS_PER_TON_STUBBLE);

  return {
    farmerTons,
    contractedTons,
    surplusTons,
    farmerPayout,
    isRush,
    effectiveTransportCost,
    deficit,
    verdict,
    approved,
    subsidy,
    newPoolBalance,
    co2PreventedTons,
    co2AtRiskTons,
  };
}

export const formatPKR = (n: number) => `${Math.round(n).toLocaleString("en-US")} PKR`;
export const formatNum = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
