import { createHmac, timingSafeEqual } from "node:crypto";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  licenseSecret: string;
  apiBase: string;
}

/** Reads the payment settings. Returns null when payments have not been set up yet. */
export function readConfig(env: NodeJS.ProcessEnv = process.env): RazorpayConfig | null {
  const keyId = env.RAZORPAY_KEY_ID?.trim();
  const keySecret = env.RAZORPAY_KEY_SECRET?.trim();
  const licenseSecret = env.LICENSE_SECRET?.trim();
  if (!keyId || !keySecret || !licenseSecret || licenseSecret.length < 16) return null;
  return { keyId, keySecret, licenseSecret, apiBase: (env.RAZORPAY_API_BASE?.trim() || "https://api.razorpay.com").replace(/\/$/, "") };
}

/** Razorpay signs "order_id|payment_id" with your key secret when a payment succeeds. */
export function isValidPaymentSignature(orderId: string, paymentId: string, signature: string, keySecret: string): boolean {
  if (!orderId || !paymentId || !signature) return false;
  const expected = Buffer.from(createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function authHeader(config: RazorpayConfig): string {
  return `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`;
}

export interface Order {
  id: string;
  amount: number;
  currency: string;
}

export class PaymentServiceError extends Error {}

export async function createOrder(config: RazorpayConfig, amountPaise: number, receipt: string): Promise<Order> {
  let res: Response;
  try {
    res = await fetch(`${config.apiBase}/v1/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader(config) },
      body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes: { product: "callfirst-pro" } }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    throw new PaymentServiceError("Could not reach the payment provider.");
  }
  if (!res.ok) throw new PaymentServiceError(`The payment provider refused the request (${res.status}).`);
  const data = (await res.json()) as Partial<Order>;
  if (typeof data.id !== "string" || typeof data.amount !== "number") throw new PaymentServiceError("Unexpected reply from the payment provider.");
  return { id: data.id, amount: data.amount, currency: data.currency ?? "INR" };
}

export interface PaymentInfo {
  id: string;
  order_id: string;
  status: string;
  amount: number;
}

/** Looks the payment up directly, so a licence is only issued for money that was really taken. */
export async function fetchPayment(config: RazorpayConfig, paymentId: string): Promise<PaymentInfo> {
  let res: Response;
  try {
    res = await fetch(`${config.apiBase}/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: authHeader(config) },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    throw new PaymentServiceError("Could not reach the payment provider.");
  }
  if (!res.ok) throw new PaymentServiceError(`The payment provider could not find that payment (${res.status}).`);
  const data = (await res.json()) as Partial<PaymentInfo>;
  if (typeof data.id !== "string" || typeof data.order_id !== "string" || typeof data.status !== "string" || typeof data.amount !== "number") {
    throw new PaymentServiceError("Unexpected reply from the payment provider.");
  }
  return { id: data.id, order_id: data.order_id, status: data.status, amount: data.amount };
}
