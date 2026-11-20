"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { ImportError, parseFile, parseText, type ParsedSheet } from "@/lib/csv";

interface Props {
  onParsed: (sheet: ParsedSheet, name: string) => void;
  onSample: () => void;
  compact?: boolean;
}

export function ImportPanel({ onParsed, onSample, compact = false }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onParsed(await parseFile(file), file.name);
    } catch (e) {
      setError(e instanceof ImportError ? e.message : "We could not read that file. Check it is a CSV and try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  function handlePaste() {
    setError("");
    try {
      onParsed(parseText(pasted), "Pasted leads");
    } catch (e) {
      setError(e instanceof ImportError ? e.message : "We could not read what you pasted.");
    }
  }

  return (
    <div className={compact ? "" : "mx-auto max-w-2xl"}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files[0]);
        }}
        className={`rounded-2xl border-2 border-dashed bg-surface px-6 py-10 text-center transition-colors ${
          dragging ? "border-accent bg-accent-soft" : "border-line"
        }`}
      >
        <svg className="mx-auto text-accent" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.600" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 15V4m0 0L8 8m4-4 4 4M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
        </svg>
        <h2 className="mt-4 text-lg font-semibold">Drop your lead export here</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          A CSV from Meta, Google, a property portal or your CRM. It is read in your browser and never uploaded.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => input.current?.click()} disabled={busy}>
            {busy ? "Reading…" : "Choose a CSV file"}
          </Button>
          <Button kind="secondary" onClick={() => setPasting((v) => !v)} aria-expanded={pasting}>
            Paste from a sheet
          </Button>
          <Button kind="ghost" onClick={onSample}>
            Try with sample leads
          </Button>
        </div>
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv,.tsv,.txt"
          className="sr-only"
          aria-label="Choose a CSV file of leads"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>

      {pasting ? (
        <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
          <label htmlFor="paste" className="text-sm font-medium">
            Paste rows copied from Excel or Google Sheets, including the heading row
          </label>
          <textarea
            id="paste"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={6}
            spellCheck={false}
            placeholder={"Name\tPhone\tBudget\nRohit Sharma\t9812045671\t1.8 Cr"}
            className="mt-2 w-full rounded-lg border border-line bg-paper p-3 font-mono text-xs"
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={handlePaste} disabled={!pasted.trim()}>
              Use these rows
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 rounded-lg border border-stop/20 bg-stop-soft px-4 py-3 text-sm text-stop">
          {error}
        </p>
      ) : null}
    </div>
  );
}
