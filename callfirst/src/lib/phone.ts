export interface PhoneResult {
  /** Digits with country code and a leading "+", or null when unusable. */
  e164: string | null;
  /** Digits only, for wa.me links. */
  digits: string | null;
  international: boolean;
  valid: boolean;
}

const INVALID: PhoneResult = { e164: null, digits: null, international: false, valid: false };

/**
 * Normalises a phone number as typed into a lead form.
 * Indian mobiles are the default; anything with another country code is kept as international.
 */
export function normalisePhone(raw: string): PhoneResult {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return INVALID;
  const hasPlus = trimmed.startsWith("+") || trimmed.startsWith("00");
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("00")) digits = digits.slice(2);
  if (!digits) return INVALID;

  // Spreadsheet exports often turn numbers into 9.19876E+11; those are unusable.
  if (/e\+?\d+$/i.test(trimmed)) return INVALID;

  if (digits.length === 10 && /^[6-9]/.test(digits)) return indian(digits);
  if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) {
    return indian(digits.slice(1));
  }
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
    return indian(digits.slice(2));
  }
  if (hasPlus && digits.length >= 8 && digits.length <= 15 && !digits.startsWith("91")) {
    return { e164: `+${digits}`, digits, international: true, valid: true };
  }
  return INVALID;
}

function indian(ten: string): PhoneResult {
  // Reject obvious junk such as 9999999999 or 9876543210 typed to get past a form.
  if (/^(\d)\1{9}$/.test(ten) || ten === "9876543210" || ten === "1234567890") return INVALID;
  return { e164: `+91${ten}`, digits: `91${ten}`, international: false, valid: true };
}

export function formatPhone(result: PhoneResult, raw: string): string {
  if (!result.valid || !result.e164) return raw || "No number";
  if (!result.international) {
    const ten = result.e164.slice(3);
    return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
  }
  return result.e164;
}
