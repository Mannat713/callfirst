import { ButtonLink, SiteFooter, SiteHeader } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-lg flex-1 px-5 py-24 text-center">
        <p className="font-mono text-sm text-faint">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">That page does not exist</h1>
        <p className="mt-2 text-muted">The link may be old, or the address may have a typo.</p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/">Go to the home page</ButtonLink>
          <ButtonLink href="/app" kind="secondary">Open the app</ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
