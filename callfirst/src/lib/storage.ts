import { DEFAULT_SETTINGS, type Lead, type ProjectSettings } from "./types";

const KEY = "callfirst:v1";

export interface SavedState {
  settings: ProjectSettings;
  leads: Lead[];
  savedAt: number;
}

const STATUSES = new Set(["new", "called", "no_answer", "visit_booked", "not_interested"]);

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

/** Stored data can be stale or hand-edited, so every field is checked on the way in. */
export function reviveState(raw: unknown): SavedState | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const s = (data.settings ?? {}) as Record<string, unknown>;
  const leads = Array.isArray(data.leads) ? data.leads : [];
  return {
    settings: {
      projectName: text(s.projectName),
      agentName: text(s.agentName),
      priceMinLakh: num(s.priceMinLakh),
      priceMaxLakh: num(s.priceMaxLakh),
      configs: list(s.configs),
      locations: list(s.locations),
    },
    leads: leads
      .filter((l): l is Record<string, unknown> => !!l && typeof l === "object" && typeof (l as { id?: unknown }).id === "string")
      .map((l) => ({
        id: text(l.id),
        name: text(l.name) || "Unnamed lead",
        phone: text(l.phone),
        email: text(l.email),
        budget: text(l.budget),
        config: text(l.config),
        location: text(l.location),
        source: text(l.source),
        message: text(l.message),
        createdAt: text(l.createdAt),
        status: (STATUSES.has(text(l.status)) ? text(l.status) : "new") as Lead["status"],
        notes: text(l.notes),
      })),
    savedAt: num(data.savedAt),
  };
}

export function loadState(): SavedState {
  const empty: SavedState = { settings: DEFAULT_SETTINGS, leads: [], savedAt: 0 };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    return reviveState(JSON.parse(raw)) ?? empty;
  } catch {
    return empty;
  }
}

/** Returns false when the browser refused to save, for example when storage is full or blocked. */
export function saveState(state: Omit<SavedState, "savedAt">): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
