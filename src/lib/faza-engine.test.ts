import { describe, expect, it } from "vitest";
import { runRulesEngine, INITIAL_POOL_BALANCE, type NegotiationInput } from "./faza-engine";
import { parseFarmerTextOffline } from "./faza-parse";

const base: NegotiationInput = {
  farmerName: "Baba Fareed",
  farmerLocation: "Shujabad",
  acres: 100,
  deadlineDays: 3,
  biomassPrice: 1500,
  tonsNeeded: 250,
  factoryBudget: 20000,
  transportCost: 35000,
  poolBalance: INITIAL_POOL_BALANCE,
};

describe("FAZA rules engine", () => {
  it("values 100 acres at 250 tons and pays 375,000 PKR at 1,500/ton", () => {
    const r = runRulesEngine(base);
    expect(r.farmerTons).toBe(250);
    expect(r.farmerPayout).toBe(375000);
  });

  it("default scenario: pool covers the 15,000 PKR deficit and drops to 485,000", () => {
    const r = runRulesEngine(base);
    expect(r.deficit).toBe(15000);
    expect(r.verdict).toBe("APPROVED_WITH_SUBSIDY");
    expect(r.subsidy).toBe(15000);
    expect(r.newPoolBalance).toBe(485000);
  });

  it("1-day deadline applies the 1.5x rush surcharge", () => {
    const r = runRulesEngine({ ...base, deadlineDays: 1 });
    expect(r.isRush).toBe(true);
    expect(r.effectiveTransportCost).toBe(52500);
  });

  it("failed deal scenario exceeds the 50,000 PKR per-deal cap and pays nothing", () => {
    const r = runRulesEngine({ ...base, deadlineDays: 1, transportCost: 85000, factoryBudget: 10000 });
    expect(r.deficit).toBe(117500);
    expect(r.verdict).toBe("FAILED_CAP");
    expect(r.subsidy).toBe(0);
    expect(r.newPoolBalance).toBe(INITIAL_POOL_BALANCE);
  });

  it("fails when the pool cannot cover the deficit", () => {
    const r = runRulesEngine({ ...base, poolBalance: 10000 });
    expect(r.verdict).toBe("FAILED_POOL");
  });

  it("no subsidy when the factory budget covers transport", () => {
    const r = runRulesEngine({ ...base, factoryBudget: 40000 });
    expect(r.verdict).toBe("APPROVED_NO_SUBSIDY");
    expect(r.subsidy).toBe(0);
  });

  it("caps contracted tons at factory demand", () => {
    const r = runRulesEngine({ ...base, acres: 200 });
    expect(r.contractedTons).toBe(250);
    expect(r.surplusTons).toBe(250);
  });
});

describe("offline fallback parser", () => {
  it("extracts Tariq / Jalalpur / 65 acres / 4 days from the sample note", () => {
    const r = parseFarmerTextOffline(
      "Mera naam Tariq hai. Jalalpur mein 65 acre ka raqba hai. 4 din mein zameen khali karni hai warna aag lagani paregi.",
    );
    expect(r).toEqual({ name: "Tariq", location: "Jalalpur", acres: 65, deadlineDays: 4 });
  });
});
