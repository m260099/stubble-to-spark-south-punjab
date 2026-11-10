import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { extractFarmerData } from "@/lib/extract.functions";
import { parseFarmerTextOffline } from "@/lib/faza-parse";
import {
  CO2_TONS_PER_TON_STUBBLE,
  INITIAL_POOL_BALANCE,
  STUBBLE_TONS_PER_ACRE,
  formatPKR,
  runRulesEngine,
  type NegotiationInput,
} from "@/lib/faza-engine";
import { FACTORY_LOCATION, MAP_CENTER, lookupTown, roadDistanceKm, type GeoPoint } from "@/lib/faza-locations";
import { LogisticsMap, type RouteStatus } from "./LogisticsMap";
import { ImpactChart } from "./ImpactChart";
import { LogicTrace, type TraceRun } from "./LogicTrace";

const DEFAULT_NL =
  "Mera naam Tariq hai. Jalalpur mein 65 acre ka raqba hai. 4 din mein zameen khali karni hai warna aag lagani paregi.";

function resolvePoint(location: string): { point: GeoPoint; known: boolean } {
  const hit = lookupTown(location);
  if (hit) return { point: hit, known: true };
  return {
    point: { name: `${location || "Unknown"} (approx.)`, lat: MAP_CENTER[0], lng: MAP_CENTER[1] },
    known: false,
  };
}

type LlmState = "idle" | "loading" | "success";

const inputBase = "w-full bg-card border border-ink-300 p-2 rounded text-ink-800";

interface DashboardProps {
  visible: boolean;
  onExit: () => void;
}

export function Dashboard({ visible, onExit }: DashboardProps) {
  const extractFn = useServerFn(extractFarmerData);

  const [poolBalance, setPoolBalance] = useState(INITIAL_POOL_BALANCE);
  const [nlInput, setNlInput] = useState(DEFAULT_NL);
  const [llmState, setLlmState] = useState<LlmState>("idle");
  const [llmSource, setLlmSource] = useState<string | null>(null);
  const [farmerHighlight, setFarmerHighlight] = useState(false);

  const [farmerName, setFarmerName] = useState("Baba Fareed");
  const [farmerLocation, setFarmerLocation] = useState("Shujabad");
  const [acres, setAcres] = useState("100");
  const [deadline, setDeadline] = useState("3");
  const [biomassPrice, setBiomassPrice] = useState("1500");
  const [tonsNeeded, setTonsNeeded] = useState("250");
  const [factoryBudget, setFactoryBudget] = useState("20000");
  const [transportCost, setTransportCost] = useState("35000");

  const [run, setRun] = useState<TraceRun | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [mapFarmer, setMapFarmer] = useState<{ point: GeoPoint; name: string }>(() => ({
    point: resolvePoint("Shujabad").point,
    name: "Baba Fareed",
  }));
  const [routeStatus, setRouteStatus] = useState<RouteStatus>("pending");
  const [chartData, setChartData] = useState({
    prevented: 0,
    atRisk: Math.round(100 * STUBBLE_TONS_PER_ACRE * CO2_TONS_PER_TON_STUBBLE * 100) / 100,
  });

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const schedule = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  // --- LLM step: natural-language parsing only ---
  const runLLMExtraction = async () => {
    if (llmState !== "idle") return;
    setLlmState("loading");
    let data = null as null | { name: string | null; location: string | null; acres: number | null; deadlineDays: number | null };
    let source = "";
    try {
      const res = await extractFn({ data: { text: nlInput } });
      if (res.ok) {
        data = res.data;
        source = `Source: LLM (${res.model})`;
      }
    } catch (err) {
      console.error(err);
    }
    if (!data) {
      data = parseFarmerTextOffline(nlInput);
      source = "Source: offline fallback parser (AI unavailable)";
    }
    if (data.name) setFarmerName(data.name);
    if (data.location) setFarmerLocation(data.location);
    if (data.acres != null) setAcres(String(data.acres));
    if (data.deadlineDays != null) setDeadline(String(data.deadlineDays));
    setLlmSource(source);
    setFarmerHighlight(true);
    setLlmState("success");
    schedule(() => {
      setLlmState("idle");
      setFarmerHighlight(false);
    }, 2500);
  };

  // --- Test Scenario Loading ---
  const loadFailedDealScenario = () => {
    setDeadline("1"); // 1 day causes rush shipping
    setTransportCost("85000"); // Too expensive
    setFactoryBudget("10000"); // Low budget
    window.alert("Loaded Stress Test: Tight deadline and high logistics cost.");
  };

  // --- Deterministic Rules Engine ---
  const runNegotiation = () => {
    if (running) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const input: NegotiationInput = {
      farmerName: farmerName.trim(),
      farmerLocation: farmerLocation.trim(),
      acres: Number(acres),
      deadlineDays: Number(deadline),
      biomassPrice: Number(biomassPrice),
      tonsNeeded: Number(tonsNeeded),
      factoryBudget: Number(factoryBudget),
      transportCost: Number(transportCost),
      poolBalance,
    };
    const result = runRulesEngine(input);
    const { point, known } = resolvePoint(input.farmerLocation);

    setRunning(true);
    setRun({
      input,
      result,
      routeLabel: point.name,
      distanceKm: roadDistanceKm(point, FACTORY_LOCATION),
      locationKnown: known,
    });
    setRevealed(0);
    setRouteStatus("pending");
    setMapFarmer({ point, name: input.farmerName || "Unknown" });

    schedule(() => setRevealed(1), 400);
    schedule(() => setRevealed(2), 1000);
    schedule(() => setRevealed(3), 1600);
    schedule(() => {
      setRevealed(4);
      setRouteStatus(result.approved ? "approved" : "failed");
      setChartData({ prevented: result.co2PreventedTons, atRisk: result.co2AtRiskTons });
      setPoolBalance(result.newPoolBalance);
      setRunning(false);
    }, 2200);
  };

  const llmLabel = useMemo(() => {
    if (llmState === "loading") return "Calling LLM API...";
    if (llmState === "success") return "Data Extracted Successfully!";
    return "Extract Data via AI / معلومات نکالیں";
  }, [llmState]);

  return (
    <div className="min-h-screen p-4 md:p-6 font-sans fade-in">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b border-ink-300 gap-4">
        <div className="text-center md:text-left flex items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-ink-800 tracking-tight">
              FAZA <span className="urdu text-3xl text-ink-600">(فضا)</span>
            </h1>
            <p className="text-ink-500 text-sm mt-1">Command Center / کمانڈ سینٹر</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-4">
            <span className="bg-farmer-50 text-farmer-700 border border-farmer-200 text-xs md:text-sm font-semibold px-4 py-2 rounded-full font-mono shadow-sm">
              LLM Parsing: ACTIVE
            </span>
            <span className="bg-factory-50 text-factory-700 border border-factory-200 text-xs md:text-sm font-semibold px-4 py-2 rounded-full font-mono shadow-sm">
              Rules Engine: ACTIVE
            </span>
          </div>
          <button type="button" onClick={onExit} className="text-sm text-ink-500 hover:text-ink-800 underline">
            Exit Demo
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inputs & Simulations */}
        <div className="lg:col-span-4 space-y-6">
          {/* Community Clean Air Pool */}
          <div className="bg-card p-5 rounded-xl border border-ink-200 shadow-sm">
            <h2 className="text-sm font-bold text-ink-700 mb-3 flex items-center justify-between uppercase tracking-wider">
              <span>Clean Air Subsidies</span>
              <span className="urdu text-xs">سبسڈی فنڈ</span>
            </h2>
            <p className="text-xs text-ink-500 mb-3">
              Funded by provincial carbon levies. Covers logistics deficits to prevent crop burning.
            </p>
            <div className="bg-fund-50 border border-fund-200 p-4 rounded-lg mb-4 text-center">
              <p className="text-xs text-fund-700 font-semibold uppercase tracking-wide mb-1">
                Available Fund Balance / فنڈ کا بیلنس
              </p>
              <p className="text-2xl font-bold text-fund-800" id="poolBalanceDisplay">
                {formatPKR(poolBalance)}
              </p>
            </div>
          </div>

          {/* LLM Input */}
          <div className="bg-card p-5 rounded-xl border border-ink-200 shadow-sm border-l-4 border-l-llm-500">
            <h2 className="text-sm font-bold text-llm-700 mb-1 uppercase tracking-wider">Natural Language Ingestion (LLM)</h2>
            <p className="text-xs text-ink-500 mb-3">
              Simulates a farmer's voice note being transcribed and passed to the LLM to extract parameters.
            </p>
            <textarea
              id="nlInput"
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              className="w-full bg-ink-50 border border-ink-300 p-3 rounded-lg text-sm text-ink-800 focus:outline-none focus:border-llm-500 focus:ring-1 focus:ring-llm-500 mb-2"
              rows={3}
            />
            <button
              type="button"
              onClick={runLLMExtraction}
              disabled={llmState !== "idle" || !nlInput.trim()}
              className={`w-full text-on-solid text-sm font-bold py-2 rounded-lg transition-all disabled:cursor-not-allowed ${
                llmState === "success"
                  ? "bg-fund-600"
                  : llmState === "loading"
                    ? "bg-llm-600 animate-pulse"
                    : "bg-llm-600 hover:bg-llm-700 disabled:opacity-60"
              }`}
            >
              {llmLabel}
            </button>
            {llmSource && <p className="text-[11px] text-ink-400 mt-2 font-mono">{llmSource}</p>}
          </div>

          {/* Dashboard Inputs */}
          <div className="bg-card p-6 rounded-xl border border-ink-200 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-ink-100 pb-2">
              <h2 className="text-lg font-bold text-ink-800">
                <span>System Data</span>
              </h2>
              <button
                type="button"
                onClick={loadFailedDealScenario}
                className="text-xs text-alert-600 hover:underline border border-alert-200 bg-alert-50 px-2 py-1 rounded"
              >
                Load Failed Deal
              </button>
            </div>

            <div className="space-y-4">
              {/* Farmer Box */}
              <div
                className={`p-4 rounded-lg border-l-4 transition-all shadow-sm ${
                  farmerHighlight ? "bg-llm-50 border-l-llm-500" : "bg-ink-50 border-l-farmer-500"
                }`}
              >
                <div className="flex justify-between items-center mb-3 border-b border-ink-200 pb-2">
                  <span className="text-sm font-bold text-farmer-700 uppercase">Farmer Data / کسان</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label htmlFor="farmerName" className="text-xs text-ink-500 block mb-1">Name</label>
                    <input id="farmerName" type="text" value={farmerName} onChange={(e) => setFarmerName(e.target.value)} className={`${inputBase} text-sm`} />
                  </div>
                  <div>
                    <label htmlFor="farmerLocation" className="text-xs text-ink-500 block mb-1">Location</label>
                    <input id="farmerLocation" type="text" value={farmerLocation} onChange={(e) => setFarmerLocation(e.target.value)} className={`${inputBase} text-sm`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="acres" className="text-xs text-ink-500 block mb-1">Acres</label>
                    <input id="acres" type="number" value={acres} onChange={(e) => setAcres(e.target.value)} className={`${inputBase} text-base font-bold text-farmer-700 text-center`} />
                  </div>
                  <div>
                    <label htmlFor="deadline" className="text-xs text-ink-500 block mb-1">Deadline (Days)</label>
                    <input id="deadline" type="number" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={`${inputBase} text-base font-bold text-ink-700 text-center`} />
                  </div>
                </div>
              </div>

              {/* Factory Box */}
              <div className="bg-ink-50 p-4 rounded-lg border-l-4 border-l-factory-600 shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b border-ink-200 pb-2">
                  <span className="text-sm font-bold text-factory-700 uppercase">Factory Data / فیکٹری</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label htmlFor="biomassPrice" className="text-xs text-ink-500 block mb-1">Pay to Farmer (per Ton)</label>
                    <input id="biomassPrice" type="number" value={biomassPrice} onChange={(e) => setBiomassPrice(e.target.value)} className={`${inputBase} text-sm font-bold`} />
                  </div>
                  <div>
                    <label htmlFor="tonsNeeded" className="text-xs text-ink-500 block mb-1">Tons Needed</label>
                    <input id="tonsNeeded" type="number" value={tonsNeeded} onChange={(e) => setTonsNeeded(e.target.value)} className={`${inputBase} text-sm font-bold`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="factoryBudget" className="text-xs text-ink-500 block mb-1">Max Transport Budget</label>
                    <input id="factoryBudget" type="number" value={factoryBudget} onChange={(e) => setFactoryBudget(e.target.value)} className={`${inputBase} text-base font-bold text-factory-700 text-center`} />
                  </div>
                  <div>
                    <label htmlFor="transportCost" className="text-xs text-ink-500 block mb-1">Actual Transport Cost</label>
                    <input id="transportCost" type="number" value={transportCost} onChange={(e) => setTransportCost(e.target.value)} className={`${inputBase} text-base font-bold text-ink-700 text-center`} />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={runNegotiation}
              disabled={running}
              className="w-full bg-ink-800 hover:bg-ink-900 disabled:opacity-70 text-on-solid font-bold py-3 rounded-lg text-base transition-all shadow-md flex justify-center items-center gap-2"
            >
              <span>Run Deterministic Rules Engine</span>
              <span className="urdu text-lg">ثالثی شروع کریں</span>
            </button>
          </div>
        </div>

        {/* Right Column: Output, Maps, Charts */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card p-5 rounded-xl border border-ink-200 shadow-sm">
              <h2 className="text-sm font-bold text-ink-700 mb-3 border-b border-ink-100 pb-2">Logistics Map / لاجسٹکس کا نقشہ</h2>
              <LogisticsMap farmer={mapFarmer.point} farmerName={mapFarmer.name} status={routeStatus} visible={visible} />
            </div>
            <div className="bg-card p-5 rounded-xl border border-ink-200 shadow-sm">
              <h2 className="text-sm font-bold text-ink-700 mb-3 border-b border-ink-100 pb-2">CO2 Prevention / کاربن کی روک تھام</h2>
              <div className="relative h-64">
                <ImpactChart preventedTons={chartData.prevented} atRiskTons={chartData.atRisk} />
              </div>
            </div>
          </div>

          {/* Deterministic Negotiator Display Engine */}
          <div className="bg-card p-6 rounded-xl border border-ink-200 shadow-sm font-mono text-sm space-y-4">
            <h2 className="text-ink-800 text-lg font-bold border-b border-ink-200 pb-3 flex flex-wrap items-center justify-between gap-2">
              <span>Deterministic Logic Trace</span>
              <span className="text-xs text-ink-500 font-sans border border-ink-300 rounded px-2 py-1">
                Zero-Hallucination Math Engine
              </span>
            </h2>
            <LogicTrace run={run} revealed={revealed} />
          </div>
        </div>
      </main>
    </div>
  );
}
