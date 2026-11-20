"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { checkKeyOnline, saveLicense, type StoredLicense } from "@/lib/pro";
import { FREE_LIMIT, PLAN_DAYS, PLAN_NAME, PRICE_LABEL, PRO_LIMIT } from "@/lib/plan";

interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  theme: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void; on: (event: string, cb: () => void) => void };
  }
}

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
    script.addEventListener("error", () => resolve(false));
    if (!existing) {
      script.src = SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

interface Props {
  open: boolean;
  hiddenCount: number;
  onClose: () => void;
  onUnlocked: (license: StoredLicense) => void;
}

type Phase = "idle" | "starting" | "paying" | "confirming" | "done";

export function UpgradeDialog({ open, hiddenCount, onClose, onUnlocked }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [restoreKey, setRestoreKey] = useState("");
  const [showRestore, setShowRestore] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const busy = phase === "starting" || phase === "paying" || phase === "confirming";

  async function pay() {
    setError("");
    setPhase("starting");
    try {
      const ready = await loadCheckout();
      if (!ready) throw new Error("The payment window could not load. Check your connection and try again.");

      const orderRes = await fetch("/api/pay/order", { method: "POST" });
      const order = (await orderRes.json()) as { orderId?: string; amount?: number; currency?: string; keyId?: string; message?: string };
      if (!orderRes.ok || !order.orderId || !order.keyId || !order.amount) {
        throw new Error(order.message ?? "Could not start the payment. Please try again.");
      }

      setPhase("paying");
      const Razorpay = window.Razorpay;
      if (!Razorpay) throw new Error("The payment window is not available.");
      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency ?? "INR",
        order_id: order.orderId,
        name: "CallFirst",
        description: `${PLAN_NAME}, ${PLAN_DAYS} days`,
        theme: { color: "#0e7a53" },
        modal: { ondismiss: () => setPhase((p) => (p === "paying" ? "idle" : p)) },
        handler: (response) => void confirm(response),
      });
      checkout.on("payment.failed", () => {
        setError("The payment did not go through. You have not been charged; please try again.");
        setPhase("idle");
      });
      checkout.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPhase("idle");
    }
  }

  async function confirm(response: RazorpaySuccess) {
    setPhase("confirming");
    try {
      const res = await fetch("/api/pay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature }),
      });
      const data = (await res.json()) as { licenseKey?: string; expiresAt?: number; message?: string };
      if (!res.ok || !data.licenseKey || !data.expiresAt) {
        throw new Error(
          `${data.message ?? "We could not confirm the payment."} If money was taken, keep this payment id and contact us: ${response.razorpay_payment_id}`,
        );
      }
      const license = { key: data.licenseKey, expiresAt: data.expiresAt };
      saveLicense(license);
      setLicenseKey(license.key);
      setPhase("done");
      onUnlocked(license);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not confirm the payment.");
      setPhase("idle");
    }
  }

  async function restore() {
    setError("");
    const key = restoreKey.trim();
    if (!key) return;
    setPhase("confirming");
    const result = await checkKeyOnline(key);
    if (result.status === "valid") {
      const license = { key, expiresAt: result.expiresAt };
      saveLicense(license);
      setPhase("done");
      setLicenseKey(key);
      onUnlocked(license);
    } else {
      setPhase("idle");
      setError(
        result.status === "invalid"
          ? "That licence key is not valid, or it has expired. Check you copied all of it."
          : "We could not check the key right now. Check your connection and try again.",
      );
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={() => {
        if (phase === "done") setPhase("idle");
        onClose();
      }}
      aria-labelledby="up-h"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-6"
    >
      {phase === "done" ? (
        <div>
          <h2 id="up-h" className="text-xl font-semibold tracking-tight">You are on Pro</h2>
          <p className="mt-2 text-muted">Every lead is now unlocked. Save your licence key somewhere safe; you need it to restore Pro on another device or after clearing your browser.</p>
          <label className="mt-4 block text-sm font-medium">
            Your licence key
            <textarea readOnly rows={3} value={licenseKey} className="mt-1 w-full rounded-lg border border-line bg-paper p-3 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
          </label>
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button
              kind="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(licenseKey);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Copied" : "Copy key"}
            </Button>
            <Button onClick={onClose}>Start using Pro</Button>
          </div>
        </div>
      ) : (
        <div>
          <h2 id="up-h" className="text-xl font-semibold tracking-tight">Unlock every lead</h2>
          <p className="mt-2 text-muted">
            {hiddenCount > 0
              ? `${hiddenCount.toLocaleString("en-IN")} more leads are ranked and waiting. The free plan shows the top ${FREE_LIMIT}.`
              : `The free plan shows the top ${FREE_LIMIT} leads of any list. Pro removes the limit.`}
          </p>
          <div className="mt-5 rounded-xl border border-line bg-paper p-4">
            <p className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">{PRICE_LABEL}</span>
              <span className="text-muted">one payment, {PLAN_DAYS} days of Pro</span>
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>Every lead in your list, up to {PRO_LIMIT.toLocaleString("en-IN")} per import</li>
              <li>The full ranked list in your CSV export</li>
              <li>Works on any device with your licence key</li>
            </ul>
          </div>
          <p className="mt-3 text-xs text-muted">
            Pay by UPI, card or net banking through Razorpay. Your leads are never sent anywhere; only the payment is.
          </p>

          {error ? (
            <p role="alert" className="mt-4 rounded-lg border border-stop/20 bg-stop-soft px-4 py-3 text-sm text-stop">{error}</p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="text-sm text-muted underline underline-offset-2" onClick={() => setShowRestore((v) => !v)} aria-expanded={showRestore}>
              I already have a licence key
            </button>
            <div className="flex gap-3">
              <Button kind="secondary" onClick={onClose} disabled={busy}>Not now</Button>
              <Button onClick={pay} disabled={busy}>
                {phase === "starting" ? "Opening…" : phase === "paying" ? "Waiting for payment…" : phase === "confirming" ? "Confirming…" : `Pay ${PRICE_LABEL}`}
              </Button>
            </div>
          </div>

          {showRestore ? (
            <div className="mt-4 border-t border-line pt-4">
              <label htmlFor="restore" className="text-sm font-medium">Paste your licence key</label>
              <textarea id="restore" rows={3} value={restoreKey} onChange={(e) => setRestoreKey(e.target.value)} spellCheck={false} placeholder="CF1...." className="mt-1 w-full rounded-lg border border-line bg-paper p-3 font-mono text-xs" />
              <div className="mt-2 flex justify-end">
                <Button kind="secondary" onClick={restore} disabled={busy || !restoreKey.trim()}>Restore Pro</Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </dialog>
  );
}
