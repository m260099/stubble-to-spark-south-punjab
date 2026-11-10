/** Deterministic coordinates for South Punjab towns used on the logistics map. */
export interface GeoPoint {
  name: string;
  lat: number;
  lng: number;
}

export const MAP_CENTER: [number, number] = [29.882, 71.2926];
export const MAP_ZOOM = 9;

export const FACTORY_LOCATION: GeoPoint = {
  name: "Multan Biomass Power Plant",
  lat: 30.205,
  lng: 71.43,
};

const TOWNS: Array<{ keys: string[]; point: GeoPoint }> = [
  { keys: ["shujabad"], point: { name: "Shujabad", lat: 29.8803, lng: 71.295 } },
  { keys: ["jalalpur", "jalalpur pirwala"], point: { name: "Jalalpur Pirwala", lat: 29.5051, lng: 71.2224 } },
  { keys: ["multan"], point: { name: "Multan", lat: 30.1575, lng: 71.5249 } },
  { keys: ["lodhran"], point: { name: "Lodhran", lat: 29.5339, lng: 71.6324 } },
  { keys: ["muzaffargarh"], point: { name: "Muzaffargarh", lat: 30.0736, lng: 71.1805 } },
  { keys: ["bahawalpur"], point: { name: "Bahawalpur", lat: 29.3956, lng: 71.6836 } },
  { keys: ["khanewal"], point: { name: "Khanewal", lat: 30.3017, lng: 71.9321 } },
  { keys: ["kabirwala"], point: { name: "Kabirwala", lat: 30.405, lng: 71.8667 } },
  { keys: ["vehari"], point: { name: "Vehari", lat: 30.0445, lng: 72.3556 } },
  { keys: ["dera ghazi khan", "dg khan", "d.g. khan"], point: { name: "Dera Ghazi Khan", lat: 30.0459, lng: 70.6403 } },
  { keys: ["rahim yar khan", "ryk"], point: { name: "Rahim Yar Khan", lat: 28.4202, lng: 70.2952 } },
  { keys: ["layyah"], point: { name: "Layyah", lat: 30.9693, lng: 70.9428 } },
  { keys: ["alipur"], point: { name: "Alipur", lat: 29.3817, lng: 70.9116 } },
];

/** Returns the town coordinates, or null when the town is not in the prototype gazetteer. */
export function lookupTown(location: string): GeoPoint | null {
  const q = location.trim().toLowerCase();
  if (!q) return null;
  const hit = TOWNS.find((t) => t.keys.some((k) => q.includes(k) || k.includes(q)));
  return hit ? hit.point : null;
}

/** Approximate road distance in km (great-circle distance x 1.25 road factor). */
export function roadDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.25);
}
