import Papa from "papaparse";
import type { ColumnMapping, FieldKey, Lead } from "./types";

export const MAX_ROWS = 5000;
export const MAX_FILE_BYTES = 8 * 1024 * 1024;

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, string>[];
  /** Rows dropped because the file was longer than MAX_ROWS. */
  truncated: number;
}

export class ImportError extends Error {}

/** Header fragments seen in Meta, Google, portal and CRM exports, most specific first. */
const HINTS: Record<FieldKey, RegExp[]> = {
  phone: [/phone/, /mobile/, /contact\s*(no|number)/, /whats\s*app/, /^cell/, /^number$/, /^contact$/],
  email: [/e-?mail/],
  name: [/full[\s_]*name/, /^name$/, /lead[\s_]*name/, /customer/, /first[\s_]*name/, /name/],
  budget: [/budget/, /price[\s_]*range/, /investment/, /afford/],
  config: [/bhk/, /config/, /bedroom/, /unit[\s_]*type/, /property[\s_]*type/, /requirement/, /looking[\s_]*for/],
  location: [/city/, /locality/, /location/, /area/, /residence/, /address/, /where/],
  source: [/source/, /platform/, /channel/, /medium/, /campaign/, /utm/],
  message: [/message/, /comment/, /remark/, /note/, /query/, /enquiry|inquiry/, /description/, /status/],
  createdAt: [/created/, /date/, /time/, /submitted/, /received/, /timestamp/],
};

const ORDER: FieldKey[] = ["phone", "email", "name", "budget", "config", "location", "createdAt", "source", "message"];

export function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const taken = new Set<string>();
  for (const field of ORDER) {
    for (const hint of HINTS[field]) {
      const match = headers.find((h) => !taken.has(h) && hint.test(h.toLowerCase().replace(/[_-]+/g, " ")));
      if (match) {
        mapping[field] = match;
        taken.add(match);
        break;
      }
    }
  }
  return mapping;
}

function clean(value: unknown): string {
  if (value === null || value === undefined) return "";
  // Meta exports prefix phone numbers with "p:" and some sheets wrap values in ="...".
  return String(value).replace(/^p:\s*/i, "").replace(/^="?|"$/g, "").trim();
}

export function parseText(text: string): ParsedSheet {
  const source = text.replace(/^\uFEFF/, "");
  if (!source.trim()) throw new ImportError("That file is empty. Export your leads again and try once more.");

  const result = Papa.parse<Record<string, unknown>>(source, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h, i) => clean(h) || `Column ${i + 1}`,
  });

  const headers = (result.meta.fields ?? []).filter(Boolean);
  if (headers.length < 2) {
    throw new ImportError(
      "We could not find columns in that file. Make sure the first row has headings such as Name and Phone.",
    );
  }

  const all = result.data
    .map((row) => Object.fromEntries(headers.map((h) => [h, clean(row[h])])))
    .filter((row) => Object.values(row).some((v) => v !== ""));
  if (all.length === 0) throw new ImportError("The file has headings but no leads under them.");

  return { headers, rows: all.slice(0, MAX_ROWS), truncated: Math.max(0, all.length - MAX_ROWS) };
}

export async function parseFile(file: File): Promise<ParsedSheet> {
  const name = file.name.toLowerCase();
  if (/\.(xlsx|xls|numbers)$/.test(name)) {
    throw new ImportError(
      "That is a spreadsheet file. In Excel or Google Sheets choose File, then Download or Save as, then CSV, and upload the CSV.",
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ImportError("That file is larger than 8 MB. Split it into smaller exports and import them one at a time.");
  }
  return parseText(await file.text());
}

let counter = 0;
function newId(): string {
  counter += 1;
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${counter}-${random}`;
}

export function rowsToLeads(rows: Record<string, string>[], mapping: ColumnMapping): Lead[] {
  const get = (row: Record<string, string>, field: FieldKey) => {
    const column = mapping[field];
    return column ? (row[column] ?? "") : "";
  };
  return rows.map((row) => ({
    id: newId(),
    name: get(row, "name") || "Unnamed lead",
    phone: get(row, "phone"),
    email: get(row, "email"),
    budget: get(row, "budget"),
    config: get(row, "config"),
    location: get(row, "location"),
    source: get(row, "source"),
    message: get(row, "message"),
    createdAt: get(row, "createdAt"),
    status: "new" as const,
    notes: "",
  }));
}
