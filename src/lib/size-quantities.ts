export const SIZE_KEYS = ["s", "m", "l", "xl", "xxl", "free_size"] as const;

export type SizeKey = (typeof SIZE_KEYS)[number];

export type SizeQuantities = Record<SizeKey, number>;

export const SIZE_LABELS: Record<SizeKey, string> = {
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
  xxl: "XXL",
  free_size: "Free size",
};

export function emptySizeQuantities(): SizeQuantities {
  return { s: 0, m: 0, l: 0, xl: 0, xxl: 0, free_size: 0 };
}

export function normalizeSizeQuantities(input?: Partial<Record<SizeKey, unknown>> | null): SizeQuantities {
  const base = emptySizeQuantities();
  if (!input) return base;
  for (const key of SIZE_KEYS) {
    const raw = input[key];
    const value = typeof raw === "number" ? raw : Number(raw ?? 0);
    base[key] = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }
  return base;
}

export function sumSizeQuantities(quantities: SizeQuantities): number {
  return SIZE_KEYS.reduce((sum, key) => sum + quantities[key], 0);
}

export function hasPositiveSizeQuantity(quantities: SizeQuantities): boolean {
  return SIZE_KEYS.some((key) => quantities[key] > 0);
}

export function addSizeQuantities(base: SizeQuantities, delta: SizeQuantities): SizeQuantities {
  const next = emptySizeQuantities();
  for (const key of SIZE_KEYS) {
    next[key] = base[key] + delta[key];
  }
  return next;
}

export function subtractSizeQuantities(base: SizeQuantities, delta: SizeQuantities): SizeQuantities {
  const next = emptySizeQuantities();
  for (const key of SIZE_KEYS) {
    next[key] = base[key] - delta[key];
  }
  return next;
}

export function formatSizeQuantities(quantities: SizeQuantities): string {
  return SIZE_KEYS.filter((key) => quantities[key] > 0)
    .map((key) => `${SIZE_LABELS[key]}: ${quantities[key]}`)
    .join(" | ");
}
