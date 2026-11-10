import type { ReactNode } from "react";
import {
  CO2_TONS_PER_TON_STUBBLE,
  MAX_SUBSIDY_PER_DEAL,
  RUSH_MULTIPLIER,
  STUBBLE_TONS_PER_ACRE,
  formatNum,
  formatPKR,
  type NegotiationInput,
  type NegotiationResult,
} from "@/lib/faza-engine";

export interface TraceRun {
  input: NegotiationInput;
  result: NegotiationResult;
  routeLabel: string;
  distanceKm: number;
  locationKnown: boolean;
}

interface LogicTraceProps {
  run: TraceRun | null;
  revealed: number;
}

const N = ({ children }: { children: ReactNode }) => <span className="highlight-num">{children}</span>;
const F = ({ children }: { children: ReactNode }) => <span className="highlight-fund">{children}</span>;
const A = ({ children }: { children: ReactNode }) => <span className="highlight-alert">{children}</span>;

function Stage({
  title,
  pendingText,
  active,
  tone = "default",
  children,
}: {
  title: string;
  pendingText: string;
  active: boolean;
  tone?: "default" | "final" | "approved" | "failed";
  children?: ReactNode;
}) {
  const toneClass =
    tone === "approved"
      ? "bg-fund-50 border-fund-200"
      : tone === "failed"
        ? "bg-alert-50 border-alert-200"
        : tone === "final"
          ? "bg-ink-50 border-ink-300 shadow-inner"
          : "bg-ink-50 border-ink-200";
  return (
    <div className={`p-4 rounded-lg border transition-colors ${toneClass}`}>
      <span className="text-ink-500 font-bold block mb-1">{title}</span>
      {active ? (
        <div className="fade-in leading-8 text-ink-700">{children}</div>
      ) : (
        <span className="text-ink-400 italic text-sm">{pendingText}</span>
      )}
    </div>
  );
}

export function LogicTrace({ run, revealed }: LogicTraceProps) {
  const r = run?.result;
  const i = run?.input;
  const finalTone = !r || revealed < 4 ? "final" : r.approved ? "approved" : "failed";

  return (
    <div className="space-y-4 mt-4 text-ink-700">
      <Stage
        title="STAGE 1: ASSET VALUATION (اثاثوں کی قیمت)"
        pendingText={run ? "Computing..." : "Awaiting execution..."}
        active={!!r && revealed >= 1}
      >
        {r && i && (
          <>
            <div>
              Farmer <N>{i.farmerName || "Unknown"}</N> holds <N>{formatNum(i.acres)}</N> acres x{" "}
              <N>{STUBBLE_TONS_PER_ACRE}</N> t/acre = <N>{formatNum(r.farmerTons)} t</N> of stubble.
            </div>
            <div>
              Factory demand: <N>{formatNum(i.tonsNeeded)} t</N>. Contracted volume: <N>{formatNum(r.contractedTons)} t</N>
              {r.surplusTons > 0 && (
                <>
                  {" "}
                  (surplus <A>{formatNum(r.surplusTons)} t</A> not covered)
                </>
              )}
              .
            </div>
            <div>
              Farmer payout: <N>{formatNum(r.contractedTons)} t</N> x <N>{formatPKR(i.biomassPrice)}</N> ={" "}
              <F>{formatPKR(r.farmerPayout)}</F>
            </div>
          </>
        )}
      </Stage>

      <Stage
        title="STAGE 2: LOGISTICS ANALYSIS (لاجسٹکس کا تجزیہ)"
        pendingText="Pending..."
        active={!!r && revealed >= 2}
      >
        {r && i && run && (
          <>
            <div>
              Route: <N>{run.routeLabel}</N> to Multan Biomass Power Plant, approx. <N>{run.distanceKm} km</N> by road.
              {!run.locationKnown && <span className="text-ink-500"> (Location not in prototype gazetteer; routed from region centre.)</span>}
            </div>
            <div>
              Deadline: <N>{formatNum(i.deadlineDays)} days</N> -{" "}
              {r.isRush ? <A>RUSH SHIPPING REQUIRED</A> : <F>STANDARD SCHEDULE</F>}
            </div>
            <div>
              Transport quote: <N>{formatPKR(i.transportCost)}</N>
              {r.isRush ? (
                <>
                  {" "}
                  x <A>{RUSH_MULTIPLIER}</A> rush surcharge = <A>{formatPKR(r.effectiveTransportCost)}</A>
                </>
              ) : (
                <>
                  {" "}
                  = <N>{formatPKR(r.effectiveTransportCost)}</N>
                </>
              )}
            </div>
          </>
        )}
      </Stage>

      <Stage
        title="STAGE 3: BUDGET CONFLICT IDENTIFICATION (تنازعہ)"
        pendingText="Pending..."
        active={!!r && revealed >= 3}
      >
        {r && i && (
          <>
            <div>
              Factory max transport budget <N>{formatPKR(i.factoryBudget)}</N> vs. logistics cost{" "}
              <N>{formatPKR(r.effectiveTransportCost)}</N>.
            </div>
            <div>
              {r.deficit > 0 ? (
                <>
                  Conflict detected. Logistics deficit: <A>{formatPKR(r.deficit)}</A>
                </>
              ) : (
                <>
                  No conflict. Factory budget fully covers logistics. Deficit: <F>{formatPKR(0)}</F>
                </>
              )}
            </div>
          </>
        )}
      </Stage>

      <Stage
        title="STAGE 4: RESOLUTION VERDICT (حتمی فیصلہ)"
        pendingText="Pending..."
        active={!!r && revealed >= 4}
        tone={finalTone}
      >
        {r && i && (
          <>
            {r.verdict === "APPROVED_WITH_SUBSIDY" && (
              <>
                <div className="font-bold text-fund-800">
                  DEAL APPROVED <span className="urdu font-normal">معاہدہ منظور</span>
                </div>
                <div>
                  Clean Air Subsidy covers deficit: <F>{formatPKR(r.subsidy)}</F> (within per-deal cap{" "}
                  <N>{formatPKR(MAX_SUBSIDY_PER_DEAL)}</N>).
                </div>
                <div>
                  Pool balance: <N>{formatPKR(i.poolBalance)}</N> - <N>{formatPKR(r.subsidy)}</N> ={" "}
                  <F>{formatPKR(r.newPoolBalance)}</F>
                </div>
              </>
            )}
            {r.verdict === "APPROVED_NO_SUBSIDY" && (
              <>
                <div className="font-bold text-fund-800">
                  DEAL APPROVED <span className="urdu font-normal">معاہدہ منظور</span>
                </div>
                <div>
                  Factory pays full logistics. Subsidy used: <F>{formatPKR(0)}</F>. Pool balance unchanged at{" "}
                  <F>{formatPKR(r.newPoolBalance)}</F>
                </div>
              </>
            )}
            {r.verdict === "FAILED_CAP" && (
              <>
                <div className="font-bold text-alert-700">
                  DEAL FAILED <span className="urdu font-normal">معاہدہ ناکام</span>
                </div>
                <div>
                  Deficit <A>{formatPKR(r.deficit)}</A> exceeds the per-deal subsidy cap{" "}
                  <N>{formatPKR(MAX_SUBSIDY_PER_DEAL)}</N>. No funds released.
                </div>
              </>
            )}
            {r.verdict === "FAILED_POOL" && (
              <>
                <div className="font-bold text-alert-700">
                  DEAL FAILED <span className="urdu font-normal">معاہدہ ناکام</span>
                </div>
                <div>
                  Deficit <A>{formatPKR(r.deficit)}</A> exceeds remaining pool balance <N>{formatPKR(i.poolBalance)}</N>.
                </div>
              </>
            )}
            <div>
              {r.approved ? (
                <>
                  CO2 prevented: <N>{formatNum(r.contractedTons)} t</N> x <N>{CO2_TONS_PER_TON_STUBBLE}</N> ={" "}
                  <F>{formatNum(r.co2PreventedTons)} t CO2</F>
                  {r.co2AtRiskTons > 0 && (
                    <>
                      {" "}
                      | Surplus still at risk: <A>{formatNum(r.co2AtRiskTons)} t CO2</A>
                    </>
                  )}
                </>
              ) : (
                <>
                  Burning risk: <A>HIGH</A> - <A>{formatNum(r.co2AtRiskTons)} t CO2</A> at risk. Escalate to district
                  agriculture officer.
                </>
              )}
            </div>
          </>
        )}
      </Stage>
    </div>
  );
}
