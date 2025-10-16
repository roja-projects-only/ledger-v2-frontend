/**
 * Centralized color definitions for locations, KPIs, and semantic states.
 */

import type { KPIVariant, Location } from "@/lib/types";
export type { KPIVariant } from "@/lib/types";

export const LOCATION_COLORS: Record<
  Location,
  {
    bg: string;
    text: string;
    border: string;
    hex: string;
    ring: string;
  }
> = {
  BANAI: {
    bg: "bg-blue-500/10",
    text: "text-blue-300",
    border: "border-blue-500/30",
    hex: "#60a5fa",          // blue-400
    ring: "ring-blue-400",
  },
  DOUBE_L: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
    hex: "#34d399",          // emerald-400
    ring: "ring-emerald-400",
  },
  JOVIL_3: {
    bg: "bg-purple-500/10",
    text: "text-purple-300",
    border: "border-purple-500/30",
    hex: "#a78bfa",          // purple-400
    ring: "ring-purple-400",
  },
  LOWER_LOOB: {
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    border: "border-amber-500/30",
    hex: "#fbbf24",          // amber-400
    ring: "ring-amber-400",
  },
  PINATUBO: {
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    border: "border-rose-500/30",
    hex: "#fb7185",          // rose-400
    ring: "ring-rose-400",
  },
  PLASTIKAN: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-300",
    border: "border-cyan-500/30",
    hex: "#22d3ee",          // cyan-400
    ring: "ring-cyan-400",
  },
  SAN_ISIDRO: {
    bg: "bg-lime-500/10",
    text: "text-lime-300",
    border: "border-lime-500/30",
    hex: "#a3e635",          // lime-400
    ring: "ring-lime-400",
  },
  UPPER_LOOB: {
    bg: "bg-orange-500/10",
    text: "text-orange-300",
    border: "border-orange-500/30",
    hex: "#fb923c",          // orange-400
    ring: "ring-orange-400",
  },
  URBAN: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-300",
    border: "border-indigo-500/30",
    hex: "#818cf8",          // indigo-400
    ring: "ring-indigo-400",
  },
  ZUNIGA: {
    bg: "bg-pink-500/10",
    text: "text-pink-300",
    border: "border-pink-500/30",
    hex: "#f472b6",          // pink-400
    ring: "ring-pink-400",
  },
};

export const KPI_VARIANTS: Record<
  KPIVariant,
  {
    bg: string;
    border: string;
    icon: string;
    iconBg: string;
  }
> = {
  revenue: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: "text-green-400",
    iconBg: "bg-green-500/15",
  },
  quantity: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: "text-blue-400",
    iconBg: "bg-blue-500/15",
  },
  average: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "text-amber-400",
    iconBg: "bg-amber-500/15",
  },
  customers: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    icon: "text-purple-400",
    iconBg: "bg-purple-500/15",
  },
};

export const SEMANTIC_COLORS = {
  success: {
    bg: "bg-green-500/10",
    text: "text-green-300",
    subtext: "text-green-400/80",
    border: "border-green-500/30",
    icon: "text-green-400",
    ring: "focus-visible:ring-green-400/50",
    hex: "#4ade80",          // green-400
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    subtext: "text-amber-400/80",
    border: "border-amber-500/30",
    icon: "text-amber-400",
    ring: "focus-visible:ring-amber-400/50",
    hex: "#fbbf24",          // amber-400
  },
  error: {
    bg: "bg-red-500/10",
    text: "text-red-300",
    subtext: "text-red-400/80",
    border: "border-red-500/30",
    icon: "text-red-400",
    ring: "focus-visible:ring-red-400/50",
    hex: "#f87171",          // red-400
  },
  info: {
    bg: "bg-sky-500/10",
    text: "text-sky-300",
    subtext: "text-sky-400/80",
    border: "border-sky-500/30",
    icon: "text-sky-400",
    ring: "focus-visible:ring-sky-400/50",
    hex: "#38bdf8",          // sky-400
  },
} as const;

export type SemanticTone = keyof typeof SEMANTIC_COLORS;

export function getLocationColor(location: Location) {
  return LOCATION_COLORS[location];
}

export function getLocationHex(location: Location): string {
  return LOCATION_COLORS[location].hex;
}

export function getLocationPalette(): string[] {
  return Object.values(LOCATION_COLORS).map((color) => color.hex);
}

export function getKPIVariant(variant: KPIVariant) {
  return KPI_VARIANTS[variant];
}

export function getSemanticColor(tone: SemanticTone) {
  return SEMANTIC_COLORS[tone];
}
