import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AuthView } from "@/components/faza/AuthView";
import { Dashboard } from "@/components/faza/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FAZA - AI Agricultural Negotiator" },
      {
        name: "description",
        content:
          "FAZA connects South Punjab farmers to biomass power plants with LLM parsing and a deterministic subsidy engine to stop crop burning.",
      },
      { property: "og:title", content: "FAZA - AI Agricultural Negotiator" },
      {
        property: "og:description",
        content: "Hybrid AI stubble-to-fuel negotiator: LLM parsing plus a zero-hallucination financial rules engine.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [view, setView] = useState<"auth" | "dashboard">("auth");
  // Dashboard mounts on first launch and stays mounted so map, chart and inputs persist across Exit Demo.
  const [launched, setLaunched] = useState(false);

  const handleLogin = () => {
    setLaunched(true);
    setView("dashboard");
  };

  return (
    <div className="font-sans antialiased">
      {view === "auth" && <AuthView onLaunch={handleLogin} />}
      {launched && (
        <div className={view === "dashboard" ? "" : "hidden"}>
          <Dashboard visible={view === "dashboard"} onExit={() => setView("auth")} />
        </div>
      )}
    </div>
  );
}
