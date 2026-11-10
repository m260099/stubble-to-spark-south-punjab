import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import { FACTORY_LOCATION, MAP_CENTER, MAP_ZOOM, type GeoPoint } from "@/lib/faza-locations";
import { cssColor } from "./css-color";

export type RouteStatus = "pending" | "approved" | "failed";

interface LogisticsMapProps {
  farmer: GeoPoint;
  farmerName: string;
  status: RouteStatus;
  visible: boolean;
}

export function LogisticsMap({ farmer, farmerName, status, visible }: LogisticsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const layerRef = useRef<Leaflet.LayerGroup | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const latest = useRef({ farmer, farmerName, status });
  latest.current = { farmer, farmerName, status };

  const draw = () => {
    const L = leafletRef.current;
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!L || !layer || !map) return;
    const { farmer: f, farmerName: name, status: s } = latest.current;
    layer.clearLayers();

    const routeColor =
      s === "approved" ? cssColor("--fund-600") : s === "failed" ? cssColor("--alert-600") : cssColor("--ink-400");

    L.polyline(
      [
        [f.lat, f.lng],
        [FACTORY_LOCATION.lat, FACTORY_LOCATION.lng],
      ],
      { color: routeColor, weight: 4, dashArray: s === "pending" ? "6 8" : undefined, opacity: 0.9 },
    ).addTo(layer);

    L.circleMarker([f.lat, f.lng], {
      radius: 9,
      color: cssColor("--farmer-700"),
      fillColor: cssColor("--farmer-500"),
      fillOpacity: 0.9,
      weight: 2,
    })
      .bindPopup(`<b>Farmer: ${escapeHtml(name)}</b><br/>${escapeHtml(f.name)}`)
      .addTo(layer);

    L.circleMarker([FACTORY_LOCATION.lat, FACTORY_LOCATION.lng], {
      radius: 10,
      color: cssColor("--factory-700"),
      fillColor: cssColor("--factory-600"),
      fillOpacity: 0.9,
      weight: 2,
    })
      .bindPopup(`<b>Factory</b><br/>${FACTORY_LOCATION.name}`)
      .addTo(layer);

    map.fitBounds(
      [
        [f.lat, f.lng],
        [FACTORY_LOCATION.lat, FACTORY_LOCATION.lng],
      ],
      { padding: [30, 30], maxZoom: 10 },
    );
  };

  // Initialize Leaflet once, after the dashboard is visible.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current).setView(MAP_CENTER, MAP_ZOOM);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "Map data &copy; OpenStreetMap",
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      draw();
      setTimeout(() => map.invalidateSize(), 50);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmer, farmerName, status]);

  useEffect(() => {
    if (visible && mapRef.current) {
      const map = mapRef.current;
      setTimeout(() => map.invalidateSize(), 50);
    }
  }, [visible]);

  return <div ref={containerRef} className="h-64 rounded-lg border border-ink-300 relative z-10" />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
