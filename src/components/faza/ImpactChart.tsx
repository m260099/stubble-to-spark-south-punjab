import { useEffect, useRef } from "react";
import type { Chart as ChartType } from "chart.js";
import { cssColor } from "./css-color";

interface ImpactChartProps {
  preventedTons: number;
  atRiskTons: number;
}

export function ImpactChart({ preventedTons, atRiskTons }: ImpactChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartType<"doughnut"> | null>(null);
  const latest = useRef({ preventedTons, atRiskTons });
  latest.current = { preventedTons, atRiskTons };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { Chart, DoughnutController, ArcElement, Tooltip, Legend } = await import("chart.js");
      if (cancelled || !canvasRef.current || chartRef.current) return;
      Chart.register(DoughnutController, ArcElement, Tooltip, Legend);
      const fund = cssColor("--fund-600");
      const alert = cssColor("--alert-600");
      chartRef.current = new Chart(canvasRef.current, {
        type: "doughnut",
        data: {
          labels: ["CO2 Prevented (tons)", "CO2 at Risk from Burning (tons)"],
          datasets: [
            {
              data: [latest.current.preventedTons, latest.current.atRiskTons],
              backgroundColor: [fund, alert],
              hoverBackgroundColor: [fund, alert],
              borderColor: cssColor("--card"),
              borderWidth: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "65%",
          plugins: {
            legend: { position: "bottom", labels: { color: cssColor("--ink-700"), boxWidth: 12 } },
          },
        },
      });
    })();
    return () => {
      cancelled = true;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const ds = chart?.data.datasets[0];
    if (!chart || !ds) return;
    ds.data = [preventedTons, atRiskTons];
    chart.update();
  }, [preventedTons, atRiskTons]);

  return <canvas ref={canvasRef} aria-label="CO2 prevention chart" role="img" />;
}
