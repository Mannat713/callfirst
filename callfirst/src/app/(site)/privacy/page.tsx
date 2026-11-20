import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "CallFirst reads your lead file in your browser. It is never uploaded to a server.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="text-4xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-3 text-muted">Last updated 21 November 2026</p>
      <div className="mt-8 space-y-5 text-lg leading-relaxed">
        <h2 className="text-2xl font-semibold tracking-tight">Your leads stay on your device</h2>
        <p>
          When you upload or paste a lead file, CallFirst reads it inside your browser. The file, the names and phone numbers in it,
          your notes and your call statuses are never sent to us or to anyone else. We have no server that could receive them.
        </p>
        <p>
          Your list is saved in this browser&apos;s local storage so it is still there when you come back. It stays until you press
          Clear in the app or clear your browser data. It is not shared between your devices.
        </p>
        <h2 className="pt-4 text-2xl font-semibold tracking-tight">When you contact a lead</h2>
        <p>
          The Call and WhatsApp buttons open your phone dialler or WhatsApp with that one lead&apos;s number. From that point the
          call or message is handled by your phone or by WhatsApp, under their terms.
        </p>
        <h2 className="pt-4 text-2xl font-semibold tracking-tight">Payments</h2>
        <p>
          Pro is paid for through Razorpay. Your card, UPI or bank details go to Razorpay and are never seen or stored by CallFirst.
          After a successful payment we give you a licence key. It contains the payment reference and an expiry date, and nothing
          about you or your leads. We do not keep an account or a customer list; the key in your browser is what unlocks Pro.
        </p>
        <h2 className="pt-4 text-2xl font-semibold tracking-tight">Analytics</h2>
        <p>
          The public pages of this site (the home page, blog and this page) may use Microsoft Clarity to understand how visitors use
          them. Clarity is not loaded on the app page where your leads are shown, so it cannot record them.
        </p>
        <h2 className="pt-4 text-2xl font-semibold tracking-tight">Your responsibilities</h2>
        <p>
          You are responsible for having the right to contact the people in the files you import, and for following the laws that
          apply to you when calling or messaging them.
        </p>
      </div>
    </div>
  );
}
