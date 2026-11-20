"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { guessMapping, parseText, rowsToLeads, type ParsedSheet } from "@/lib/csv";
import { SAMPLE_SETTINGS, sampleCsv } from "@/lib/sample";
import { scoreLeads } from "@/lib/scoring";
import { clearState, loadState, saveState } from "@/lib/storage";
import { DEFAULT_SETTINGS, type ColumnMapping, type Lead, type ProjectSettings } from "@/lib/types";
import { ImportPanel } from "./ImportPanel";
import { LeadList } from "./LeadList";
import { SetupStep } from "./SetupStep";

interface Pending {
  sheet: ParsedSheet;
  fileName: string;
  mapping: ColumnMapping;
}

function samplePending(): Pending {
  const sheet = parseText(sampleCsv());
  return { sheet, fileName: "Sample leads", mapping: guessMapping(sheet.headers) };
}

interface Initial {
  leads: Lead[];
  settings: ProjectSettings;
  pending: Pending | null;
}

/** Runs once in the browser: restores the saved list, or starts the sample when the link asks for it. */
function initialState(): Initial {
  const saved = loadState();
  const wantsSample = new URLSearchParams(window.location.search).get("sample") === "1";
  if (wantsSample && saved.leads.length === 0) {
    return { leads: [], settings: SAMPLE_SETTINGS, pending: samplePending() };
  }
  return { leads: saved.leads, settings: saved.settings, pending: null };
}

/** Client only (see LeadApp), so browser storage can be read while the first state is created. */
export default function LeadWorkspace() {
  const [initial] = useState(initialState);
  const [leads, setLeads] = useState<Lead[]>(initial.leads);
  const [settings, setSettings] = useState<ProjectSettings>(initial.settings);
  const [pending, setPending] = useState<Pending | null>(initial.pending);
  const [importing, setImporting] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  // Scores depend on how old an enquiry is, so "now" is fixed per session to keep ranks from shuffling mid-call.
  const [now] = useState(() => Date.now());

  const startSample = useCallback(() => {
    setSettings(SAMPLE_SETTINGS);
    setPending(samplePending());
  }, []);

  useEffect(() => {
    // Drop ?sample=1 so a refresh does not restart the sample over real work.
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setSaveFailed(!saveState({ leads, settings })), 250);
    return () => window.clearTimeout(timer);
  }, [leads, settings]);

  const scored = useMemo(() => scoreLeads(leads, settings, now), [leads, settings, now]);

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    setLeads((all) => all.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  function confirmImport(mode: "replace" | "add") {
    if (!pending) return;
    const fresh = rowsToLeads(pending.sheet.rows, pending.mapping);
    setLeads((current) => (mode === "add" ? [...current, ...fresh] : fresh));
    setPending(null);
    setImporting(false);
    window.scrollTo({ top: 0 });
  }

  let body;
  if (pending) {
    body = (
      <SetupStep
        sheet={pending.sheet}
        fileName={pending.fileName}
        mapping={pending.mapping}
        settings={settings}
        hasExisting={leads.length > 0}
        onMapping={(mapping) => setPending({ ...pending, mapping })}
        onSettings={setSettings}
        onCancel={() => setPending(null)}
        onConfirm={confirmImport}
      />
    );
  } else if (leads.length === 0 || importing) {
    body = (
      <div>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            {importing ? "Import more leads" : "Who should you call first?"}
          </h1>
          <p className="mt-2 text-muted">
            Upload your lead export and get a ranked call list in seconds, with the reason for every rank.
          </p>
        </div>
        <div className="mt-8">
          <ImportPanel
            onParsed={(sheet, fileName) => setPending({ sheet, fileName, mapping: guessMapping(sheet.headers) })}
            onSample={startSample}
          />
        </div>
        {importing ? (
          <p className="mt-6 text-center">
            <button type="button" className="text-sm text-muted underline underline-offset-2" onClick={() => setImporting(false)}>
              Back to my list
            </button>
          </p>
        ) : (
          <ul className="mx-auto mt-10 grid max-w-2xl gap-3 text-sm text-muted sm:grid-cols-3">
            <li className="rounded-xl border border-line bg-surface p-4"><strong className="block text-ink">Private</strong>Your file is read on this device. Nothing is uploaded.</li>
            <li className="rounded-xl border border-line bg-surface p-4"><strong className="block text-ink">Explained</strong>Every rank comes with the reasons behind it.</li>
            <li className="rounded-xl border border-line bg-surface p-4"><strong className="block text-ink">Saved</strong>Statuses and notes stay in this browser until you clear them.</li>
          </ul>
        )}
      </div>
    );
  } else {
    body = (
      <LeadList
        scored={scored}
        settings={settings}
        saveFailed={saveFailed}
        onSettings={setSettings}
        onUpdate={updateLead}
        onAddMore={() => setImporting(true)}
        onClear={() => {
          clearState();
          setLeads([]);
          setSettings(DEFAULT_SETTINGS);
        }}
      />
    );
  }

  return body;
}
