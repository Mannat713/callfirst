import { PLAN_DAYS, PRICE_PAISE } from "./plan";
import { checkLicense, issueLicense } from "./license";
import {
  PaymentServiceError,
  createOrder,
  fetchPayment,
  isValidPaymentSignature,
  readConfig,
  type RazorpayConfig,
} from "./razorpay";

type Env = NodeJS.ProcessEnv;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();
    if (text.length > 4000) return null;
    const data = JSON.parse(text);
    return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const str = (v: unknown, max = 200) => (typeof v === "string" && v.length > 0 && v.length <= max ? v : "");

function notReady(): Response {
  return json({ error: "not_configured", message: "Payments are not set up on this site yet." }, 503);
}

/** Starts a payment: asks Razorpay for an order at the fixed Pro price. */
export async function handleCreateOrder(_request: Request, env: Env = process.env): Promise<Response> {
  const config = readConfig(env);
  if (!config) return notReady();
  try {
    const order = await createOrder(config, PRICE_PAISE, `cf_${Date.now().toString(36)}`);
    return json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: config.keyId });
  } catch (e) {
    const message = e instanceof PaymentServiceError ? e.message : "Could not start the payment.";
    return json({ error: "provider_error", message }, 502);
  }
}

/** Finishes a payment: checks it is genuine, then hands back a signed licence key. */
export async function handleVerifyPayment(request: Request, env: Env = process.env): Promise<Response> {
  const config = readConfig(env);
  if (!config) return notReady();

  const body = await readBody(request);
  const orderId = str(body?.orderId);
  const paymentId = str(body?.paymentId);
  const signature = str(body?.signature, 300);
  if (!orderId || !paymentId || !signature) return json({ error: "bad_request", message: "Missing payment details." }, 400);

  if (!isValidPaymentSignature(orderId, paymentId, signature, config.keySecret)) {
    return json({ error: "bad_signature", message: "That payment could not be verified." }, 400);
  }
  return issueIfPaid(config, orderId, paymentId);
}

async function issueIfPaid(config: RazorpayConfig, orderId: string, paymentId: string): Promise<Response> {
  try {
    const payment = await fetchPayment(config, paymentId);
    const paid = payment.status === "captured" || payment.status === "authorized";
    if (payment.order_id !== orderId || payment.amount < PRICE_PAISE || !paid) {
      return json({ error: "not_paid", message: "That payment has not been completed." }, 402);
    }
  } catch (e) {
    const message = e instanceof PaymentServiceError ? e.message : "Could not confirm the payment.";
    return json({ error: "provider_error", message }, 502);
  }
  const key = issueLicense(paymentId, config.licenseSecret, PLAN_DAYS);
  const result = checkLicense(key, config.licenseSecret);
  return json({ licenseKey: key, expiresAt: result.valid ? result.payload.exp * 1000 : null });
}

/** Lets the browser ask whether a stored licence key is still good. */
export async function handleVerifyLicense(request: Request, env: Env = process.env): Promise<Response> {
  const config = readConfig(env);
  if (!config) return json({ valid: false, reason: "not_configured" });
  const body = await readBody(request);
  const key = str(body?.key, 600);
  if (!key) return json({ valid: false, reason: "malformed" });
  const result = checkLicense(key, config.licenseSecret);
  return result.valid ? json({ valid: true, expiresAt: result.payload.exp * 1000 }) : json({ valid: false, reason: result.reason });
}
