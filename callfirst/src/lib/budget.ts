export interface BudgetRange {
  /** Rupees in lakh. */
  minLakh: number;
  maxLakh: number;
}

const UNIT = /(crores?|crs?|cr\.?|lakhs?|lacs?|lac|lkh|l\b|k\b|thousand|million|mn)/i;

function unitToLakh(value: number, unit: string | undefined): number | null {
  if (!unit) return null;
  const u = unit.toLowerCase().replace(".", "");
  if (u.startsWith("cr")) return value * 100;
  if (u.startsWith("la") || u === "l" || u === "lkh") return value;
  if (u === "k" || u === "thousand") return value / 100;
  if (u === "million" || u === "mn") return value * 10;
  return null;
}

/**
 * Reads a budget the way buyers type it: "1.5 Cr", "80L", "80-90 lakh", "₹1,20,00,000", "above 2 cr".
 * Returns null when nothing usable is found.
 */
export function parseBudget(raw: string): BudgetRange | null {
  const text = (raw ?? "").toLowerCase().replace(/₹|rs\.?|inr/g, " ").replace(/,/g, "").trim();
  if (!text) return null;

  const matches = [...text.matchAll(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${UNIT.source}?`, "gi"))];
  if (matches.length === 0) return null;

  // A trailing unit applies to earlier bare numbers: "80-90 lakh", "1-1.5 cr".
  const lastUnit = [...matches].reverse().find((m) => m[2])?.[2];
  const values: number[] = [];
  for (const m of matches) {
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n <= 0) continue;
    const unit = m[2] ?? lastUnit;
    let lakh = unitToLakh(n, unit);
    if (lakh === null) {
      // No unit anywhere: treat large numbers as rupees, small ones as lakh or crore by size.
      if (n >= 100000) lakh = n / 100000;
      else if (n >= 10) lakh = n;
      else lakh = n * 100;
    }
    values.push(lakh);
  }
  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (values.length === 1) {
    if (/(above|over|more than|\+|min|minimum|upwards)/.test(text)) return { minLakh: min, maxLakh: min * 1.5 };
    if (/(below|under|upto|up to|less than|max|maximum|within)/.test(text)) return { minLakh: min * 0.7, maxLakh: min };
    return { minLakh: min, maxLakh: max };
  }
  return { minLakh: min, maxLakh: max };
}

export function formatLakh(lakh: number): string {
  if (lakh >= 100) {
    const cr = lakh / 100;
    return `₹${Number.isInteger(cr) ? cr : cr.toFixed(cr < 10 ? 2 : 1).replace(/\.?0+$/, "")} Cr`;
  }
  return `₹${Math.round(lakh)} L`;
}
