"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { downloadCsv, toCsv } from "@/lib/export";
import { draftMessage, whatsappLink } from "@/lib/messages";
import { formatPhone, normalisePhone } from "@/lib/phone";
import {
  BUCKET_LABEL,
  STATUS_LABEL,
  type Bucket,
  type Lead,
  type LeadStatus,
  type ProjectSettings,
  type ScoredLead,
} from "@/lib/types";
import { ProjectFields } from "./SetupStep";

const BUCKETS: Bucket[] = ["call_today", "this_week", "nurture", "skip"];
const BUCKET_STYLE: Record<Bucket, { chip: string; bar: string; hint: string }> = {
  call_today: { chip: "bg-accent-soft text-accent-strong", bar: "bg-accent", hint: "Hot and a good fit" },
  this_week: { chip: "bg-warn-soft text-warn", bar: "bg-warn", hint: "Worth a call soon" },
  nurture: { chip: "bg-calm-soft text-calm", bar: "bg-calm", hint: "Send the brochure" },
  skip: { chip: "bg-stop-soft text-stop", bar: "bg-stop", hint: "Duplicates and dead ends" },
};
const STATUSES: LeadStatus[] = ["new", "called", "no_answer", "visit_booked", "not_interested"];
const PAGE = 100;

interface Props {
  scored: ScoredLead[];
  settings: ProjectSettings;
  saveFailed: boolean;
  onSettings: (next: ProjectSettings) => void;
  onUpdate: (id: string, patch: Partial<Lead>) => void;
  onAddMore: () => void;
  onClear: () => void;
}

function useDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return ref;
}

export function LeadList({ scored, settings, saveFailed, onSettings, onUpdate, onAddMore, onClear }: Props) {
  const [bucket, setBucket] = useState<Bucket | "all">("all");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const counts = useMemo(() => {
    const c: Record<Bucket, number> = { call_today: 0, this_week: 0, nurture: 0, skip: 0 };
    for (const s of scored) c[s.bucket] += 1;
    return c;
  }, [scored]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scored.filter((s) => {
      if (bucket !== "all" && s.bucket !== bucket) return false;
      if (status !== "all" && s.lead.status !== status) return false;
      if (!q) return true;
      return [s.lead.name, s.lead.phone, s.lead.email, s.lead.location, s.lead.message, s.lead.notes]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [scored, bucket, status, query]);

  const rankOf = useMemo(() => new Map(scored.map((s, i) => [s.lead.id, i + 1])), [scored]);
  const open = openId ? (scored.find((s) => s.lead.id === openId) ?? null) : null;
  const done = scored.filter((s) => s.lead.status !== "new").length;
  const hasProject = settings.priceMinLakh > 0 || settings.configs.length > 0 || settings.locations.length > 0;

  const settingsRef = useDialog(showSettings);
  const clearRef = useDialog(confirmClear);
  const select = "h-10 rounded-lg border border-line bg-surface px-2 text-sm";

  function resetPaging<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setShown(PAGE);
    };
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {scored.length.toLocaleString("en-IN")} leads · {done.toLocaleString("en-IN")} worked
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{settings.projectName.trim() || "Your call list"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button kind="secondary" onClick={() => setShowSettings(true)}>Project details</Button>
          <Button kind="secondary" onClick={onAddMore}>Import more</Button>
          <Button
            kind="secondary"
            onClick={() => downloadCsv(`callfirst-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(scored))}
          >
            Export CSV
          </Button>
          <Button kind="danger" onClick={() => setConfirmClear(true)}>Clear</Button>
        </div>
      </div>

      {saveFailed ? (
        <p role="alert" className="mt-4 rounded-lg border border-warn/20 bg-warn-soft px-4 py-3 text-sm text-warn">
          Your browser would not save this list, so it will be lost when you close the tab. Export a CSV to keep your work.
        </p>
      ) : null}
      {!hasProject ? (
        <p className="mt-4 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
          Ranking on intent only.{" "}
          <button type="button" className="font-medium text-accent underline underline-offset-2" onClick={() => setShowSettings(true)}>
            Add your price range and configurations
          </button>{" "}
          to rank on fit as well.
        </p>
      ) : null}

      <div role="group" aria-label="Filter by priority" className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {BUCKETS.map((b) => {
          const active = bucket === b;
          return (
            <button
              key={b}
              type="button"
              aria-pressed={active}
              onClick={() => resetPaging(setBucket)(active ? "all" : b)}
              className={`rounded-2xl border bg-surface p-4 text-left transition-colors ${
                active ? "border-ink shadow-sm" : "border-line hover:border-faint"
              }`}
            >
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${BUCKET_STYLE[b].chip}`}>
                {BUCKET_LABEL[b]}
              </span>
              <span className="mt-2 block text-3xl font-semibold tabular-nums tracking-tight">{counts[b]}</span>
              <span className="block text-xs text-muted">{BUCKET_STYLE[b].hint}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[14rem] flex-1">
          <span className="sr-only">Search leads</span>
          <input
            type="search"
            value={query}
            onChange={(e) => resetPaging(setQuery)(e.target.value)}
            placeholder="Search name, phone, city or notes"
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
          />
        </label>
        <label className="text-sm text-muted">
          <span className="sr-only">Filter by call status</span>
          <select className={select} value={status} onChange={(e) => resetPaging(setStatus)(e.target.value as LeadStatus | "all")}>
            <option value="all">Any status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </label>
        <p className="text-sm text-muted" role="status">
          Showing {Math.min(shown, filtered.length).toLocaleString("en-IN")} of {filtered.length.toLocaleString("en-IN")}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line bg-surface px-6 py-12 text-center">
          <p className="font-medium">No leads match these filters</p>
          <Button kind="secondary" className="mt-4" onClick={() => { setBucket("all"); setStatus("all"); setQuery(""); }}>
            Show every lead
          </Button>
        </div>
      ) : (
        <ol className="mt-4 space-y-2">
          {filtered.slice(0, shown).map((s) => (
            <LeadRow
              key={s.lead.id}
              scored={s}
              rank={rankOf.get(s.lead.id) ?? 0}
              settings={settings}
              onOpen={() => setOpenId(s.lead.id)}
              onStatus={(next) => onUpdate(s.lead.id, { status: next })}
            />
          ))}
        </ol>
      )}
      {filtered.length > shown ? (
        <div className="mt-4 text-center">
          <Button kind="secondary" onClick={() => setShown((n) => n + PAGE)}>Show {Math.min(PAGE, filtered.length - shown)} more</Button>
        </div>
      ) : null}

      <LeadDrawer scored={open} rank={open ? (rankOf.get(open.lead.id) ?? 0) : 0} settings={settings} onClose={() => setOpenId(null)} onUpdate={onUpdate} />

      <dialog ref={settingsRef} onClose={() => setShowSettings(false)} aria-labelledby="set-h" className="m-auto w-[min(42rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-6">
        <h2 id="set-h" className="text-lg font-semibold">Project details</h2>
        <p className="mt-1 text-sm text-muted">The list re-ranks as you type.</p>
        <div className="mt-4">
          {showSettings ? <ProjectFields settings={settings} onChange={onSettings} /> : null}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setShowSettings(false)}>Done</Button>
        </div>
      </dialog>

      <dialog ref={clearRef} onClose={() => setConfirmClear(false)} aria-labelledby="clr-h" className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-6">
        <h2 id="clr-h" className="text-lg font-semibold">Clear this list?</h2>
        <p className="mt-2 text-sm text-muted">
          This removes all {scored.length.toLocaleString("en-IN")} leads, their statuses and notes from this browser. It cannot be undone. Export a CSV first if you need a copy.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button kind="secondary" onClick={() => setConfirmClear(false)}>Keep my list</Button>
          <Button kind="danger" onClick={() => { setConfirmClear(false); onClear(); }}>Clear everything</Button>
        </div>
      </dialog>
    </div>
  );
}

function ContactActions({ scored, settings, message }: { scored: ScoredLead; settings: ProjectSettings; message?: string }) {
  const phone = normalisePhone(scored.lead.phone);
  const link = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:bg-paper";
  if (!phone.valid || !phone.digits) {
    return scored.lead.email ? (
      <a className={link} href={`mailto:${scored.lead.email}`}>Email</a>
    ) : (
      <span className="text-xs text-faint">No way to reach</span>
    );
  }
  return (
    <>
      <a className={link} href={`tel:${phone.e164}`} aria-label={`Call ${scored.lead.name}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
        Call
      </a>
      <a
        className={link}
        href={whatsappLink(phone.digits, message ?? draftMessage(scored, settings))}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Message ${scored.lead.name} on WhatsApp`}
      >
        WhatsApp
      </a>
    </>
  );
}

function ScoreBar({ scored }: { scored: ScoredLead }) {
  return (
    <div className="flex items-center gap-2" title={`Intent ${scored.intent}, fit ${scored.fit}`}>
      <span className="w-8 text-right text-sm font-semibold tabular-nums">{scored.score}</span>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <span className={`block h-full rounded-full ${BUCKET_STYLE[scored.bucket].bar}`} style={{ width: `${scored.score}%` }} />
      </span>
    </div>
  );
}

function LeadRow({
  scored,
  rank,
  settings,
  onOpen,
  onStatus,
}: {
  scored: ScoredLead;
  rank: number;
  settings: ProjectSettings;
  onOpen: () => void;
  onStatus: (next: LeadStatus) => void;
}) {
  const { lead } = scored;
  const worked = lead.status !== "new";
  const phone = normalisePhone(lead.phone);
  return (
    <li className={`rounded-xl border border-line bg-surface p-4 ${worked ? "opacity-75" : ""}`}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <span className="mt-0.5 w-8 shrink-0 font-mono text-sm text-faint" aria-label={`Rank ${rank}`}>{rank}</span>
        <div className="min-w-[12rem] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onOpen} className="text-left font-semibold hover:underline">
              {lead.name}
            </button>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BUCKET_STYLE[scored.bucket].chip}`}>
              {BUCKET_LABEL[scored.bucket]}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {formatPhone(phone, lead.phone)}
            {[lead.config, lead.budget, lead.location].filter(Boolean).map((v) => ` · ${v}`).join("")}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Why this rank">
            {scored.reasons.slice(0, 3).map((r, i) => (
              <li
                key={i}
                className={`rounded-md px-2 py-0.5 text-xs ${
                  r.tone === "good" ? "bg-accent-soft text-accent-strong" : r.tone === "bad" ? "bg-stop-soft text-stop" : "bg-paper text-muted"
                }`}
              >
                {r.text}
              </li>
            ))}
            {scored.reasons.length === 0 ? <li className="rounded-md bg-paper px-2 py-0.5 text-xs text-muted">Little to go on</li> : null}
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <ScoreBar scored={scored} />
          <label>
            <span className="sr-only">Status for {lead.name}</span>
            <select
              className="h-9 rounded-lg border border-line bg-surface px-2 text-sm"
              value={lead.status}
              onChange={(e) => onStatus(e.target.value as LeadStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </label>
          <ContactActions scored={scored} settings={settings} />
        </div>
      </div>
    </li>
  );
}

function LeadDrawer({
  scored,
  rank,
  settings,
  onClose,
  onUpdate,
}: {
  scored: ScoredLead | null;
  rank: number;
  settings: ProjectSettings;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Lead>) => void;
}) {
  const ref = useDialog(scored !== null);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="lead-h"
      className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-[min(30rem,100vw)] max-w-none overflow-y-auto border-0 border-l border-line bg-surface p-6"
    >
      {scored ? (
        // Keyed so the message draft starts fresh for each lead and whenever its status changes.
        <DrawerBody key={`${scored.lead.id}:${scored.lead.status}`} scored={scored} rank={rank} settings={settings} onClose={onClose} onUpdate={onUpdate} />
      ) : null}
    </dialog>
  );
}

function DrawerBody({
  scored,
  rank,
  settings,
  onClose,
  onUpdate,
}: {
  scored: ScoredLead;
  rank: number;
  settings: ProjectSettings;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Lead>) => void;
}) {
  const draft = draftMessage(scored, settings);
  const [message, setMessage] = useState(draft);
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-faint">Rank {rank}</p>
          <h2 id="lead-h" className="text-xl font-semibold tracking-tight">{scored.lead.name}</h2>
          <p className="text-sm text-muted">{formatPhone(normalisePhone(scored.lead.phone), scored.lead.phone)}</p>
        </div>
        <Button kind="ghost" size="sm" onClick={onClose} aria-label="Close lead details">Close</Button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        {[["Score", scored.score], ["Intent", scored.intent], ["Fit", scored.fit]].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-paper py-3">
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-6 text-sm font-semibold">Why this rank</h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {scored.reasons.map((r, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden="true" className={r.tone === "good" ? "text-accent" : r.tone === "bad" ? "text-stop" : "text-faint"}>
              {r.tone === "good" ? "+" : r.tone === "bad" ? "−" : "•"}
            </span>
            {r.text}
          </li>
        ))}
        {scored.reasons.length === 0 ? <li className="text-muted">Nothing in this enquiry stood out either way.</li> : null}
      </ul>

      <dl className="mt-6 grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
        {[
          ["Email", scored.lead.email],
          ["Budget", scored.lead.budget],
          ["Wants", scored.lead.config],
          ["City", scored.lead.location],
          ["Source", scored.lead.source],
          ["Enquired", scored.lead.createdAt],
          ["Message", scored.lead.message],
        ]
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="break-words">{v}</dd>
            </div>
          ))}
      </dl>

      <label className="mt-6 block text-sm font-semibold">
        Status
        <select
          className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-2 text-sm font-normal"
          value={scored.lead.status}
          onChange={(e) => onUpdate(scored.lead.id, { status: e.target.value as LeadStatus })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-semibold">
        Notes
        <textarea
          className="mt-1 w-full rounded-lg border border-line bg-surface p-3 text-sm font-normal"
          rows={3}
          maxLength={1000}
          value={scored.lead.notes}
          placeholder="What did they say on the call?"
          onChange={(e) => onUpdate(scored.lead.id, { notes: e.target.value })}
        />
      </label>

      <label className="mt-4 block text-sm font-semibold">
        Message draft
        <textarea
          className="mt-1 w-full rounded-lg border border-line bg-surface p-3 text-sm font-normal"
          rows={5}
          maxLength={1000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ContactActions scored={scored} settings={settings} message={message} />
        <Button
          kind="ghost"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(message);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied" : "Copy message"}
        </Button>
        {message !== draft ? (
          <Button kind="ghost" size="sm" onClick={() => setMessage(draft)}>Reset draft</Button>
        ) : null}
      </div>
    </div>
  );
}
