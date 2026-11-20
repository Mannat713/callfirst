"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Logo } from "@/components/ui";

// The workspace reads the saved list from browser storage, so it is rendered in the browser only.
const LeadWorkspace = dynamic(() => import("./LeadWorkspace"), {
  ssr: false,
  loading: () => (
    <p className="py-24 text-center text-sm text-muted" role="status">
      Loading your list…
    </p>
  ),
});

export function LeadApp() {
  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="CallFirst home">
            <Logo />
          </Link>
          <p className="hidden items-center gap-2 text-xs text-muted sm:flex">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            Runs in your browser. Leads never leave this device.
          </p>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        <LeadWorkspace />
      </main>
    </>
  );
}
