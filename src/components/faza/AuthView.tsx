interface AuthViewProps {
  onLaunch: (role: "farmer" | "factory") => void;
}

export function AuthView({ onLaunch }: AuthViewProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 fade-in">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-ink-800 tracking-tight mb-2">
            FAZA <span className="urdu text-4xl text-ink-600">(فضا)</span>
          </h1>
          <p className="text-ink-500 text-lg">Hybrid AI: LLM Parsing + Deterministic Financial Engine</p>
          <p className="text-ink-400 text-sm mt-2">Hackathon Demonstration Environment</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Farmer Auth Card */}
          <div className="bg-card p-8 rounded-2xl border border-ink-200 shadow-sm transition-all hover:shadow-md text-center">
            <div className="border-b border-ink-100 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-farmer-700">Farmer View</h2>
              <h3 className="urdu text-xl text-farmer-600 mt-1">کسان پورٹل</h3>
            </div>
            <p className="text-sm text-ink-500 mb-6">
              Experience the voice-to-text USSD input system designed for off-grid agricultural workers.
            </p>
            <button
              type="button"
              onClick={() => onLaunch("farmer")}
              className="w-full bg-farmer-600 hover:bg-farmer-700 text-on-solid font-bold py-3 rounded-lg transition-colors"
            >
              Launch Farmer Demo / ڈیمو شروع کریں
            </button>
          </div>

          {/* Factory Auth Card */}
          <div className="bg-card p-8 rounded-2xl border border-ink-200 shadow-sm transition-all hover:shadow-md text-center">
            <div className="border-b border-ink-100 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-factory-700">Factory View</h2>
              <h3 className="urdu text-xl text-factory-600 mt-1">فیکٹری پورٹل</h3>
            </div>
            <p className="text-sm text-ink-500 mb-6">
              Manage biomass procurement, adjust maximum transport budgets, and view logistics routing.
            </p>
            <button
              type="button"
              onClick={() => onLaunch("factory")}
              className="w-full bg-factory-600 hover:bg-factory-700 text-on-solid font-bold py-3 rounded-lg transition-colors"
            >
              Launch Factory Demo / ڈیمو شروع کریں
            </button>
          </div>
        </div>

        <div className="mt-12 text-center text-ink-400 text-sm">
          <p>Prototype Data - For Demonstration Purposes Only</p>
        </div>
      </div>
    </div>
  );
}
