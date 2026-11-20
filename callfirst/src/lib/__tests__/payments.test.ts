import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkLicense, issueLicense } from "../license";
import { handleCreateOrder, handleVerifyLicense, handleVerifyPayment } from "../handlers";
import { isValidPaymentSignature, readConfig } from "../razorpay";
import { PRICE_PAISE } from "../plan";

const SECRET = "license-secret-at-least-16-chars";
const ENV = { RAZORPAY_KEY_ID: "rzp_test_abc", RAZORPAY_KEY_SECRET: "key_secret_123", LICENSE_SECRET: SECRET } as unknown as NodeJS.ProcessEnv;
const sig = (orderId: string, paymentId: string, secret = ENV.RAZORPAY_KEY_SECRET as string) =>
  createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
const post = (body: unknown) => new Request("http://x/api", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });

afterEach(() => vi.restoreAllMocks());

describe("licence keys", () => {
  const now = Date.parse("2026-11-20T00:00:00Z");

  it("issues a key that checks out and carries the expiry", () => {
    const key = issueLicense("pay_1", SECRET, 365, now);
    const result = checkLicense(key, SECRET, now + 1000);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.payload.exp * 1000 - now).toBe(365 * 86400 * 1000);
  });

  it("rejects a key after it expires", () => {
    const key = issueLicense("pay_1", SECRET, 365, now);
    expect(checkLicense(key, SECRET, now + 366 * 86400 * 1000)).toEqual({ valid: false, reason: "expired" });
  });

  it("rejects a key signed with another secret, or edited to last longer", () => {
    const key = issueLicense("pay_1", SECRET, 1, now);
    expect(checkLicense(key, "another-secret-of-16-chars", now)).toEqual({ valid: false, reason: "bad_signature" });
    const [p, body, s] = key.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), exp: 9999999999 })).toString("base64url");
    expect(checkLicense(`${p}.${forged}.${s}`, SECRET, now)).toEqual({ valid: false, reason: "bad_signature" });
  });

  it.each(["", "abc", "CF1.a", "CF1..", "XX1.a.b", "CF1.a.b.c"])("treats %j as malformed", (key) => {
    expect(checkLicense(key, SECRET, now).valid).toBe(false);
  });
});

describe("payment signature", () => {
  it("accepts the real signature and nothing else", () => {
    expect(isValidPaymentSignature("order_1", "pay_1", sig("order_1", "pay_1"), "key_secret_123")).toBe(true);
    expect(isValidPaymentSignature("order_1", "pay_2", sig("order_1", "pay_1"), "key_secret_123")).toBe(false);
    expect(isValidPaymentSignature("order_1", "pay_1", sig("order_1", "pay_1", "wrong"), "key_secret_123")).toBe(false);
    expect(isValidPaymentSignature("order_1", "pay_1", "", "key_secret_123")).toBe(false);
    expect(isValidPaymentSignature("order_1", "pay_1", "short", "key_secret_123")).toBe(false);
  });
});

describe("configuration", () => {
  it("is null until every setting is present, and the licence secret is long enough", () => {
    expect(readConfig({} as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(readConfig({ ...ENV, LICENSE_SECRET: "short" } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(readConfig(ENV)?.keyId).toBe("rzp_test_abc");
  });
});

function mockRazorpay(handlers: { order?: () => Response; payment?: () => Response }) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith("/v1/orders")) return handlers.order?.() ?? new Response("no", { status: 500 });
    if (url.includes("/v1/payments/")) return handlers.payment?.() ?? new Response("no", { status: 500 });
    throw new Error("unexpected " + url);
  });
}

describe("create order", () => {
  it("says payments are not set up when keys are missing", async () => {
    const res = await handleCreateOrder(post({}), {} as unknown as NodeJS.ProcessEnv);
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("not_configured");
  });

  it("creates an order at the fixed price and never trusts the browser for the amount", async () => {
    const spy = mockRazorpay({ order: () => Response.json({ id: "order_9", amount: PRICE_PAISE, currency: "INR" }) });
    const res = await handleCreateOrder(post({ amount: 1 }), ENV);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(JSON.parse(text)).toMatchObject({ orderId: "order_9", amount: PRICE_PAISE, keyId: "rzp_test_abc" });
    expect(text).not.toContain("key_secret_123");
    const sent = JSON.parse(String((spy.mock.calls[0][1] as RequestInit).body));
    expect(sent.amount).toBe(PRICE_PAISE);
  });

  it("reports a provider failure as 502", async () => {
    mockRazorpay({ order: () => new Response("bad", { status: 401 }) });
    expect((await handleCreateOrder(post({}), ENV)).status).toBe(502);
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    expect((await handleCreateOrder(post({}), ENV)).status).toBe(502);
  });
});

describe("verify payment", () => {
  const good = { orderId: "order_9", paymentId: "pay_9", signature: sig("order_9", "pay_9") };
  const paid = (over: object = {}) => () => Response.json({ id: "pay_9", order_id: "order_9", status: "captured", amount: PRICE_PAISE, ...over });

  it("issues a working licence for a genuine, paid, matching payment", async () => {
    mockRazorpay({ payment: paid() });
    const res = await handleVerifyPayment(post(good), ENV);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(checkLicense(data.licenseKey, SECRET).valid).toBe(true);
  });

  it("refuses a forged signature without calling Razorpay", async () => {
    const spy = mockRazorpay({ payment: paid() });
    const res = await handleVerifyPayment(post({ ...good, signature: "0".repeat(64) }), ENV);
    expect(res.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it.each([
    ["unpaid", { status: "failed" }],
    ["wrong order", { order_id: "order_other" }],
    ["underpaid", { amount: 100 }],
  ])("refuses a %s payment", async (_name, over) => {
    mockRazorpay({ payment: paid(over) });
    expect((await handleVerifyPayment(post(good), ENV)).status).toBe(402);
  });

  it("handles missing fields, bad JSON and oversized bodies", async () => {
    expect((await handleVerifyPayment(post({ orderId: "x" }), ENV)).status).toBe(400);
    expect((await handleVerifyPayment(post("not json"), ENV)).status).toBe(400);
    expect((await handleVerifyPayment(post("x".repeat(5000)), ENV)).status).toBe(400);
  });

  it("asks the user to keep the payment id when confirmation fails after signature passes", async () => {
    mockRazorpay({ payment: () => new Response("down", { status: 500 }) });
    expect((await handleVerifyPayment(post(good), ENV)).status).toBe(502);
  });
});

describe("verify licence", () => {
  it("answers valid, invalid and unconfigured", async () => {
    const key = issueLicense("pay_1", SECRET, 30);
    expect(await (await handleVerifyLicense(post({ key }), ENV)).json()).toMatchObject({ valid: true });
    expect(await (await handleVerifyLicense(post({ key: key + "x" }), ENV)).json()).toMatchObject({ valid: false });
    expect(await (await handleVerifyLicense(post({}), ENV)).json()).toMatchObject({ valid: false, reason: "malformed" });
    expect(await (await handleVerifyLicense(post({ key }), {} as unknown as NodeJS.ProcessEnv)).json()).toMatchObject({ valid: false, reason: "not_configured" });
  });
});
