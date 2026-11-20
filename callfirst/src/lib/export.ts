import Papa from "papaparse";
import { BUCKET_LABEL, STATUS_LABEL, type ScoredLead } from "./types";

/** Cells starting with these characters are run as formulas by spreadsheet apps. */
function safeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function toCsv(scored: ScoredLead[]): string {
  const rows = scored.map((s, i) => ({
    Rank: String(i + 1),
    Priority: BUCKET_LABEL[s.bucket],
    Score: String(s.score),
    Intent: String(s.intent),
    Fit: String(s.fit),
    Name: safeCell(s.lead.name),
    Phone: s.phoneE164 ?? safeCell(s.lead.phone),
    Email: safeCell(s.lead.email),
    Budget: safeCell(s.lead.budget),
    Configuration: safeCell(s.lead.config),
    Location: safeCell(s.lead.location),
    Source: safeCell(s.lead.source),
    "Enquiry date": safeCell(s.lead.createdAt),
    Status: STATUS_LABEL[s.lead.status],
    Why: s.reasons.map((r) => r.text).join("; "),
    Message: safeCell(s.lead.message),
    Notes: safeCell(s.lead.notes),
  }));
  return Papa.unparse(rows);
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
