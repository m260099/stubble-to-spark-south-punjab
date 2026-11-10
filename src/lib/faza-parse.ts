/**
 * Offline fallback parser for farmer voice-note transcripts (Roman Urdu / English).
 * Used only when the LLM call is unavailable, so the demo never breaks.
 */
export interface ExtractedFarmerData {
  name: string | null;
  location: string | null;
  acres: number | null;
  deadlineDays: number | null;
}

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function parseFarmerTextOffline(text: string): ExtractedFarmerData {
  const name =
    text.match(/naam\s+([A-Za-z]+)/i)?.[1] ??
    text.match(/(?:my name is|i am|this is)\s+([A-Za-z]+)/i)?.[1] ??
    null;
  const location =
    text.match(/([A-Za-z]+(?:\s[A-Za-z]+)?)\s+(?:mein|mai|main)\b/i)?.[1]?.split(/\s+/).pop() ??
    text.match(/\b(?:in|from|at)\s+([A-Z][A-Za-z]+)/)?.[1] ??
    null;
  const acresRaw = text.match(/(\d+(?:\.\d+)?)\s*(?:acre|acres|ekar|killa|killay)/i)?.[1];
  const daysRaw = text.match(/(\d+)\s*(?:din|days?|roz)/i)?.[1];
  return {
    name: name ? titleCase(name) : null,
    location: location ? titleCase(location) : null,
    acres: acresRaw ? Number(acresRaw) : null,
    deadlineDays: daysRaw ? Number(daysRaw) : null,
  };
}
