import { parseBudget, formatLakh, type BudgetRange } from "./budget";
import { normalisePhone } from "./phone";
import type { Bucket, Lead, ProjectSettings, Reason, ScoredLead } from "./types";

const DAY = 24 * 60 * 60 * 1000;

const VISIT = /\b(site\s*visit|visit|see the (flat|property|site)|come (and|to) see|show\s*flat|sample\s*flat)\b/i;
const PRICE = /\b(price|pricing|cost\s*sheet|payment\s*plan|quote|quotation|rate|per\s*sq|emi|booking amount|offer)\b/i;
const URGENT = /\b(call me|call back|callback|urgent|immediately|asap|today|this week|ready to (buy|book)|want to book|finali[sz]e)\b/i;
const DETAIL = /\b(possession|ready to move|rera|floor plan|brochure|carpet area|loan|home loan|parking|vastu)\b/i;
const NEGATIVE = /\b(not interested|just browsing|just looking|wrong number|by mistake|don'?t call|do not call|no need|already (bought|booked|purchased))\b/i;
const BROKER = /\b(broker|channel partner|\bcp\b|agent|realtor|dealer|consultant|property advisor|we have clients|my clients?)\b/i;
const JOB = /\b(jobs?|vacanc(y|ies)|hiring|internships?|careers?|resume|cv)\b/i;

const SOURCE_WEIGHT: Array<[RegExp, number, string]> = [
  [/referr|reference|friend|family/i, 12, "Came through a referral"],
  [/walk[\s-]?in/i, 12, "Walked in"],
  [/google|search|website|organic|direct|landing/i, 8, "Came looking for the project"],
  [/whats\s*app|wa\b/i, 6, "Messaged on WhatsApp"],
  [/99\s*acres|magic\s*bricks|housing|no\s*broker|portal/i, 3, "From a property portal"],
];

/** Turns the free-text date columns that ad platforms export into a timestamp. */
export function parseDate(raw: string): number | null {
  const text = (raw ?? "").trim();
  if (!text) return null;
  const direct = Date.parse(text);
  if (!Number.isNaN(direct)) return direct;
  // dd/mm/yyyy or dd-mm-yyyy, optionally with a time.
  const m = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const year = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
  const date = new Date(year, Number(m[2]) - 1, Number(m[1]), Number(m[4] ?? 12), Number(m[5] ?? 0));
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function bhk(text: string): string | null {
  const m = (text ?? "").toLowerCase().match(/(\d(?:\.5)?)\s*(bhk|bed|br\b|rk)/);
  if (m) return `${m[1]} BHK`;
  if (/villa|plot|penthouse|studio/i.test(text ?? "")) return text.trim().toLowerCase();
  return null;
}

function scoreIntent(lead: Lead, now: number, phoneValid: boolean, reasons: Reason[]): number {
  let intent = 30;
  const text = `${lead.message} ${lead.notes}`;

  const when = parseDate(lead.createdAt);
  if (when === null) {
    intent += 8;
  } else {
    const days = Math.max(0, (now - when) / DAY);
    if (days <= 1) {
      intent += 25;
      reasons.push({ text: "Enquired in the last 24 hours", tone: "good" });
    } else if (days <= 3) {
      intent += 18;
      reasons.push({ text: "Enquired in the last 3 days", tone: "good" });
    } else if (days <= 7) {
      intent += 10;
    } else if (days <= 30) {
      intent += 4;
    } else {
      reasons.push({ text: `Enquiry is ${Math.round(days)} days old`, tone: "bad" });
    }
  }

  if (VISIT.test(text)) {
    intent += 20;
    reasons.push({ text: "Asked about a site visit", tone: "good" });
  }
  if (PRICE.test(text)) {
    intent += 12;
    reasons.push({ text: "Asked about price or payment plan", tone: "good" });
  }
  if (URGENT.test(text)) {
    intent += 12;
    reasons.push({ text: "Wants a call back soon", tone: "good" });
  }
  if (DETAIL.test(text)) intent += 6;
  if (lead.message.trim().length > 40) intent += 4;

  for (const [pattern, weight, label] of SOURCE_WEIGHT) {
    if (pattern.test(lead.source)) {
      intent += weight;
      if (weight >= 8) reasons.push({ text: label, tone: "good" });
      break;
    }
  }

  if (phoneValid) intent += 5;
  if (/\S+@\S+\.\S+/.test(lead.email)) intent += 3;
  return clamp(intent);
}

function scoreFit(lead: Lead, settings: ProjectSettings, reasons: Reason[]): number {
  const parts: Array<{ value: number; weight: number }> = [];

  const budget = parseBudget(lead.budget) ?? parseBudget(extractBudgetFromText(lead.message));
  const hasRange = settings.priceMinLakh > 0 && settings.priceMaxLakh >= settings.priceMinLakh;
  if (budget && hasRange) {
    const { priceMinLakh: min, priceMaxLakh: max } = settings;
    if (budget.maxLakh >= min && budget.minLakh <= max) {
      parts.push({ value: 100, weight: 0.6 });
      reasons.push({ text: `Budget ${describeBudget(budget, lead.budget)} fits the price range`, tone: "good" });
    } else if (budget.minLakh > max) {
      parts.push({ value: 85, weight: 0.6 });
      reasons.push({ text: `Budget ${formatLakh(budget.minLakh)} is above the range, can afford it`, tone: "good" });
    } else if (budget.maxLakh >= min * 0.85) {
      parts.push({ value: 55, weight: 0.6 });
      reasons.push({ text: `Budget ${formatLakh(budget.maxLakh)} is a little short`, tone: "neutral" });
    } else {
      parts.push({ value: 10, weight: 0.6 });
      reasons.push({ text: `Budget ${formatLakh(budget.maxLakh)} is well below ${formatLakh(min)}`, tone: "bad" });
    }
  } else if (budget && !hasRange) {
    parts.push({ value: 60, weight: 0.3 });
  }

  const wanted = bhk(lead.config) ?? bhk(lead.message);
  if (wanted && settings.configs.length > 0) {
    const offered = settings.configs.map((c) => bhk(c) ?? c.trim().toLowerCase());
    if (offered.includes(wanted)) {
      parts.push({ value: 100, weight: 0.2 });
      reasons.push({ text: `Wants ${wanted}, which you sell`, tone: "good" });
    } else {
      parts.push({ value: 25, weight: 0.2 });
      reasons.push({ text: `Wants ${wanted}, not on offer`, tone: "bad" });
    }
  }

  const where = lead.location.trim().toLowerCase();
  if (where && settings.locations.length > 0) {
    const hit = settings.locations.some((l) => {
      const target = l.trim().toLowerCase();
      return target && (where.includes(target) || target.includes(where));
    });
    parts.push({ value: hit ? 100 : 45, weight: 0.2 });
    if (hit) reasons.push({ text: `Based in ${lead.location.trim()}`, tone: "good" });
  }

  if (parts.length === 0) return 50;
  const total = parts.reduce((sum, p) => sum + p.weight, 0);
  return clamp(parts.reduce((sum, p) => sum + p.value * p.weight, 0) / total);
}

/** Shows a budget the way the buyer meant it: "₹2 Cr+", "under ₹1 Cr", "₹80 L to ₹90 L". */
function describeBudget(budget: BudgetRange, raw: string): string {
  const text = raw.toLowerCase();
  if (/(above|over|more than|\+|minimum|upwards)/.test(text)) return `${formatLakh(budget.minLakh)}+`;
  if (/(below|under|upto|up to|less than|maximum|within)/.test(text)) return `under ${formatLakh(budget.maxLakh)}`;
  if (budget.minLakh === budget.maxLakh) return formatLakh(budget.maxLakh);
  return `${formatLakh(budget.minLakh)} to ${formatLakh(budget.maxLakh)}`;
}

function extractBudgetFromText(text: string): string {
  const m = (text ?? "").match(/(\d+(?:\.\d+)?\s*(?:-|to)\s*)?\d+(?:\.\d+)?\s*(crores?|cr\b|lakhs?|lacs?)/i);
  return m ? m[0] : "";
}

function bucketFor(score: number): Bucket {
  if (score >= 80) return "call_today";
  if (score >= 55) return "this_week";
  return "nurture";
}

/**
 * Scores every lead and orders the list so the first row is the next call to make.
 * Rules are deliberately simple and every one that fires is reported back as a reason.
 */
export function scoreLeads(leads: Lead[], settings: ProjectSettings, now: number = Date.now()): ScoredLead[] {
  const seen = new Map<string, string>();
  const ordered = [...leads].sort((a, b) => (parseDate(b.createdAt) ?? 0) - (parseDate(a.createdAt) ?? 0));
  const duplicates = new Map<string, string>();
  for (const lead of ordered) {
    const phone = normalisePhone(lead.phone);
    const key = phone.e164 ?? (lead.email.trim() ? `mail:${lead.email.trim().toLowerCase()}` : "");
    if (!key) continue;
    const first = seen.get(key);
    if (first) duplicates.set(lead.id, first);
    else seen.set(key, lead.id);
  }

  const scored = leads.map((lead): ScoredLead => {
    const reasons: Reason[] = [];
    const phone = normalisePhone(lead.phone);
    const text = `${lead.message} ${lead.notes} ${lead.name}`;
    const intent = scoreIntent(lead, now, phone.valid, reasons);
    const fit = scoreFit(lead, settings, reasons);
    let score = clamp(intent * 0.55 + fit * 0.45);
    let bucket = bucketFor(score);
    const duplicateOf = duplicates.get(lead.id) ?? null;

    if (phone.international) reasons.push({ text: "International number, check the time zone", tone: "neutral" });

    const skip = (why: string) => {
      bucket = "skip";
      score = Math.min(score, 20);
      reasons.unshift({ text: why, tone: "bad" });
    };
    if (duplicateOf) skip("Duplicate of a newer enquiry");
    else if (!phone.valid && !/\S+@\S+\.\S+/.test(lead.email)) skip("No working phone number or email");
    else if (NEGATIVE.test(text)) skip("Said they are not interested");
    else if (BROKER.test(text)) skip("Looks like a broker, not a buyer");
    else if (JOB.test(text)) skip("Asking about a job, not a home");
    else if (!phone.valid) {
      reasons.push({ text: "Phone number looks wrong, email only", tone: "bad" });
      score = Math.min(score, 55);
      bucket = bucketFor(score);
    }

    // A good fit who showed no sign of wanting a call is a brochure, not a phone call.
    if (bucket !== "skip" && bucket !== "nurture" && intent < 40) bucket = "nurture";

    if (lead.status === "not_interested") skip("Marked not interested");

    return {
      lead,
      intent,
      fit,
      score,
      bucket,
      reasons,
      phoneE164: phone.e164,
      international: phone.international,
      duplicateOf,
    };
  });

  const rank: Record<Bucket, number> = { call_today: 0, this_week: 1, nurture: 2, skip: 3 };
  return scored.sort(
    (a, b) =>
      rank[a.bucket] - rank[b.bucket] ||
      b.score - a.score ||
      (parseDate(b.lead.createdAt) ?? 0) - (parseDate(a.lead.createdAt) ?? 0) ||
      a.lead.name.localeCompare(b.lead.name),
  );
}
