import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <rect width="26" height="26" rx="7" fill="#0e7a53" />
        <path d="M7 8.500h12M7 13h8M7 17.500h4" stroke="#fff" strokeWidth="2.200" strokeLinecap="round" />
        <circle cx="19" cy="16.500" r="3" fill="#fff" />
      </svg>
      CallFirst
    </span>
  );
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const SIZES = { md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base", sm: "h-8 px-3 text-sm" };
const KINDS = {
  primary: "bg-accent text-white hover:bg-accent-strong",
  secondary: "border border-line bg-surface text-ink hover:bg-paper",
  ghost: "text-muted hover:bg-black/5 hover:text-ink",
  danger: "border border-stop/30 bg-surface text-stop hover:bg-stop-soft",
};

type Kind = keyof typeof KINDS;
type Size = keyof typeof SIZES;

export function Button({
  kind = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { kind?: Kind; size?: Size }) {
  return <button type="button" {...props} className={`${BASE} ${SIZES[size]} ${KINDS[kind]} ${className}`} />;
}

export function ButtonLink({
  kind = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & { kind?: Kind; size?: Size; children: ReactNode }) {
  return (
    <Link {...props} className={`${BASE} ${SIZES[size]} ${KINDS[kind]} ${className}`}>
      {children}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" aria-label="CallFirst home">
          <Logo className="text-lg" />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link href="/#how" className="hidden rounded-lg px-3 py-2 text-sm text-muted hover:text-ink sm:block">
            How it works
          </Link>
          <Link href="/#pricing" className="hidden rounded-lg px-3 py-2 text-sm text-muted hover:text-ink sm:block">
            Pricing
          </Link>
          <Link href="/blog" className="rounded-lg px-3 py-2 text-sm text-muted hover:text-ink">
            Blog
          </Link>
          <ButtonLink href="/app" size="sm" className="ml-1">
            Open the app
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Logo className="text-base text-ink" />
          <span>Know which lead to call first.</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/app" className="hover:text-ink">App</Link>
          <Link href="/blog" className="hover:text-ink">Blog</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
