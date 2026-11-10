/** Reads a design-system color token at runtime so canvas/SVG libraries share the theme. */
export function cssColor(token: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}
