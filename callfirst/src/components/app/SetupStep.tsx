"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { ParsedSheet } from "@/lib/csv";
import { FIELD_LABEL, type ColumnMapping, type FieldKey, type ProjectSettings } from "@/lib/types";

const FIELDS: FieldKey[] = ["name", "phone", "email", "budget", "config", "location", "source", "createdAt", "message"];

export function splitList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export function ProjectFields({
  settings,
  onChange,
}: {
  settings: ProjectSettings;
  onChange: (next: ProjectSettings) => void;
}) {
  const [configs, setConfigs] = useState(settings.configs.join(", "));
  const [locations, setLocations] = useState(settings.locations.join(", "));
  const rangeWrong = settings.priceMinLakh > 0 && settings.priceMaxLakh > 0 && settings.priceMaxLakh < settings.priceMinLakh;
  const field = "mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm";

  const price = (key: "priceMinLakh" | "priceMaxLakh") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    onChange({ ...settings, [key]: Number.isFinite(n) && n > 0 ? n : 0 });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">
        Project name
        <input className={field} value={settings.projectName} maxLength={80} placeholder="Skyline Residences"
          onChange={(e) => onChange({ ...settings, projectName: e.target.value })} />
      </label>
      <label className="text-sm font-medium">
        Your name <span className="font-normal text-faint">(for message drafts)</span>
        <input className={field} value={settings.agentName} maxLength={60} placeholder="Asha"
          onChange={(e) => onChange({ ...settings, agentName: e.target.value })} />
      </label>
      <label className="text-sm font-medium">
        Lowest price <span className="font-normal text-faint">(in lakh)</span>
        <input className={field} type="number" min={0} step={5} inputMode="decimal" placeholder="150"
          value={settings.priceMinLakh || ""} onChange={price("priceMinLakh")} />
      </label>
      <label className="text-sm font-medium">
        Highest price <span className="font-normal text-faint">(in lakh)</span>
        <input className={field} type="number" min={0} step={5} inputMode="decimal" placeholder="240"
          value={settings.priceMaxLakh || ""} onChange={price("priceMaxLakh")} aria-invalid={rangeWrong} />
      </label>
      {rangeWrong ? (
        <p role="alert" className="text-sm text-stop sm:col-span-2">
          The highest price is below the lowest. Budget fit is ignored until this is fixed.
        </p>
      ) : null}
      <label className="text-sm font-medium">
        Configurations you sell
        <input className={field} value={configs} placeholder="3 BHK, 4 BHK"
          onChange={(e) => {
            setConfigs(e.target.value);
            onChange({ ...settings, configs: splitList(e.target.value) });
          }} />
      </label>
      <label className="text-sm font-medium">
        Cities you sell into
        <input className={field} value={locations} placeholder="Gurugram, Delhi"
          onChange={(e) => {
            setLocations(e.target.value);
            onChange({ ...settings, locations: splitList(e.target.value) });
          }} />
      </label>
    </div>
  );
}

interface Props {
  sheet: ParsedSheet;
  fileName: string;
  mapping: ColumnMapping;
  settings: ProjectSettings;
  hasExisting: boolean;
  onMapping: (next: ColumnMapping) => void;
  onSettings: (next: ProjectSettings) => void;
  onCancel: () => void;
  onConfirm: (mode: "replace" | "add") => void;
}

export function SetupStep({ sheet, fileName, mapping, settings, hasExisting, onMapping, onSettings, onCancel, onConfirm }: Props) {
  const contactable = Boolean(mapping.phone || mapping.email);
  const preview = sheet.rows.slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-sm text-muted">
        {fileName} · {sheet.rows.length.toLocaleString("en-IN")} leads
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Check the columns, then describe the project</h1>

      {sheet.truncated > 0 ? (
        <p role="status" className="mt-4 rounded-lg border border-warn/20 bg-warn-soft px-4 py-3 text-sm text-warn">
          Only the first {sheet.rows.length.toLocaleString("en-IN")} leads are used. {sheet.truncated.toLocaleString("en-IN")} more
          were left out; import them as a second file.
        </p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-line bg-surface p-5" aria-labelledby="map-h">
        <h2 id="map-h" className="font-semibold">1. Which column is which?</h2>
        <p className="mt-1 text-sm text-muted">We matched what we could. Fix anything that looks wrong; unused fields can stay empty.</p>
        <div className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <label key={f} className="text-sm font-medium">
              {FIELD_LABEL[f]}
              <select
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-2 text-sm"
                value={mapping[f] ?? ""}
                onChange={(e) => {
                  const next = { ...mapping };
                  if (e.target.value) next[f] = e.target.value;
                  else delete next[f];
                  onMapping(next);
                }}
              >
                <option value="">Not in this file</option>
                {sheet.headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {!contactable ? (
          <p role="alert" className="mt-4 rounded-lg border border-stop/20 bg-stop-soft px-4 py-3 text-sm text-stop">
            Pick the phone or email column. Without one there is nobody to call.
          </p>
        ) : null}

        <div className="mt-5 overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[36rem] text-left text-xs">
            <caption className="sr-only">First rows of your file as they will be read</caption>
            <thead className="bg-paper text-muted">
              <tr>
                {FIELDS.filter((f) => mapping[f]).map((f) => (
                  <th key={f} scope="col" className="px-3 py-2 font-medium">{FIELD_LABEL[f]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="border-t border-line">
                  {FIELDS.filter((f) => mapping[f]).map((f) => (
                    <td key={f} className="max-w-[14rem] truncate px-3 py-2">{row[mapping[f] as string] || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-surface p-5" aria-labelledby="proj-h">
        <h2 id="proj-h" className="font-semibold">2. What are you selling?</h2>
        <p className="mt-1 text-sm text-muted">
          Optional, but this is how CallFirst judges fit. You can change it later and the list re-ranks.
        </p>
        <div className="mt-4">
          <ProjectFields settings={settings} onChange={onSettings} />
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button kind="ghost" onClick={onCancel}>Cancel</Button>
        <div className="flex flex-wrap gap-3">
          {hasExisting ? (
            <Button kind="secondary" disabled={!contactable} onClick={() => onConfirm("add")}>
              Add to my current list
            </Button>
          ) : null}
          <Button disabled={!contactable} onClick={() => onConfirm("replace")}>
            {hasExisting ? "Replace my list" : "Rank my leads"}
          </Button>
        </div>
      </div>
    </div>
  );
}
