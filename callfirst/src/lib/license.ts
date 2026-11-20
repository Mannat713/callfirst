import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A licence key is a small signed note: which payment it came from and when it expires.
 * It is signed with LICENSE_SECRET, so it can be checked later without a database.
 * Format: CF1.<payload>.<signature>, both parts base64url.
 */
export interface LicensePayload {
  /** Razorpay payment id. */
  pid: string;
  /** Issued at, seconds since 1970. */
  iat: number;
  /** Expires at, seconds since 1970. */
  exp: number;
}

const PREFIX = "CF1";

function b64(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(`${PREFIX}.${body}`).digest("base64url");
}

export function issueLicense(paymentId: string, secret: string, days: number, nowMs: number = Date.now()): string {
  const iat = Math.floor(nowMs / 1000);
  const payload: LicensePayload = { pid: paymentId, iat, exp: iat + days * 86400 };
  const body = b64(JSON.stringify(payload));
  return `${PREFIX}.${body}.${sign(body, secret)}`;
}

export type LicenseCheck =
  | { valid: true; payload: LicensePayload }
  | { valid: false; reason: "malformed" | "bad_signature" | "expired" };

export function checkLicense(key: string, secret: string, nowMs: number = Date.now()): LicenseCheck {
  const parts = (key ?? "").trim().split(".");
  if (parts.length !== 3 || parts[0] !== PREFIX || !parts[1] || !parts[2]) return { valid: false, reason: "malformed" };

  const expected = Buffer.from(sign(parts[1], secret));
  const given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { valid: false, reason: "bad_signature" };

  let payload: LicensePayload;
  try {
    const raw = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Partial<LicensePayload>;
    if (typeof raw.pid !== "string" || typeof raw.exp !== "number" || typeof raw.iat !== "number") {
      return { valid: false, reason: "malformed" };
    }
    payload = { pid: raw.pid, iat: raw.iat, exp: raw.exp };
  } catch {
    return { valid: false, reason: "malformed" };
  }
  if (payload.exp * 1000 <= nowMs) return { valid: false, reason: "expired" };
  return { valid: true, payload };
}
