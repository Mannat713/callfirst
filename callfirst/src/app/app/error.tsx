"use client";

import { Button } from "@/components/ui";
import { clearState } from "@/lib/storage";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto max-w-lg px-5 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong showing your list</h1>
      <p className="mt-2 text-muted">
        Your leads are still saved in this browser. Try again first; if the page keeps failing, clearing the saved list will fix it.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button
          kind="danger"
          onClick={() => {
            clearState();
            window.location.reload();
          }}
        >
          Clear saved list and reload
        </Button>
      </div>
    </main>
  );
}
