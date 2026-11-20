const KEY = "callfirst:license";

export interface StoredLicense {
  key: string;
  /** Milliseconds since 1970, from the server's last answer. */
  expiresAt: number;
}

export function loadLicense(): StoredLicense | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<StoredLicense>;
    if (typeof data.key !== "string" || typeof data.expiresAt !== "number") return null;
    return { key: data.key, expiresAt: data.expiresAt };
  } catch {
    return null;
  }
}

export function saveLicense(license: StoredLicense): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(license));
  } catch {
    // The key is also shown on screen so it can be copied if storage is blocked.
  }
}

export function removeLicense(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to remove.
  }
}

export type CheckResult = { status: "valid"; expiresAt: number } | { status: "invalid" } | { status: "unreachable" };

/** Asks the server whether a licence key is genuine and current. */
export async function checkKeyOnline(key: string): Promise<CheckResult> {
  try {
    const res = await fetch("/api/license/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (!res.ok) return { status: "unreachable" };
    const data = (await res.json()) as { valid?: boolean; expiresAt?: number; reason?: string };
    if (data.valid && typeof data.expiresAt === "number") return { status: "valid", expiresAt: data.expiresAt };
    // Payments switched off on the server must not take away what someone already paid for.
    return data.reason === "not_configured" ? { status: "unreachable" } : { status: "invalid" };
  } catch {
    return { status: "unreachable" };
  }
}
