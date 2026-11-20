import { describe, expect, it } from "vitest";
import { parseBudget, formatLakh } from "../budget";
import { normalisePhone } from "../phone";
import { guessMapping, parseText, rowsToLeads, ImportError } from "../csv";
import { parseDate, scoreLeads } from "../scoring";
import { sampleCsv, SAMPLE_SETTINGS } from "../sample";
import { toCsv } from "../export";
import { reviveState } from "../storage";
import { draftMessage } from "../messages";
import type { Lead } from "../types";

const NOW = Date.parse("2026-11-20T10:00:00Z");

function lead(over: Partial<Lead>): Lead {
  return {
    id: over.id ?? Math.random().toString(36),
    name: "Test Lead",
    phone: "9812045671",
    email: "",
    budget: "",
    config: "",
    location: "",
    source: "",
    message: "",
    createdAt: "",
    status: "new",
    notes: "",
    ...over,
  };
}

describe("parseBudget", () => {
  it.each([
    ["1.5 Cr", 150, 150],
    ["80L", 80, 80],
    ["80 lakh", 80, 80],
    ["80-90 lakh", 80, 90],
    ["2 - 2.5 cr", 200, 250],
    ["₹1,20,00,000", 120, 120],
    ["Rs. 95 lacs", 95, 95],
    ["1.5 crore to 2 crore", 150, 200],
  ])("reads %s", (raw, min, max) => {
    expect(parseBudget(raw)).toEqual({ minLakh: min, maxLakh: max });
  });

  it("treats 'above' as a floor and 'under' as a ceiling", () => {
    expect(parseBudget("above 2 cr")?.minLakh).toBe(200);
    expect(parseBudget("under 1 cr")?.maxLakh).toBe(100);
  });

  it("returns null for blanks and words", () => {
    expect(parseBudget("")).toBeNull();
    expect(parseBudget("not decided")).toBeNull();
  });

  it("formats lakh and crore", () => {
    expect(formatLakh(80)).toBe("₹80 L");
    expect(formatLakh(150)).toBe("₹1.5 Cr");
    expect(formatLakh(200)).toBe("₹2 Cr");
  });
});

describe("normalisePhone", () => {
  it.each(["9812045671", "+91 98120 45671", "098120-45671", "919812045671", "p:+919812045671".replace("p:", "")])(
    "accepts %s",
    (raw) => {
      expect(normalisePhone(raw).e164).toBe("+919812045671");
    },
  );

  it("keeps international numbers and flags them", () => {
    const r = normalisePhone("+971 50 123 4567");
    expect(r.valid).toBe(true);
    expect(r.international).toBe(true);
  });

  it.each(["", "12345", "9999999999", "9.19811E+11", "5812045671", "abc"])("rejects %s", (raw) => {
    expect(normalisePhone(raw).valid).toBe(false);
  });
});

describe("csv import", () => {
  it("maps Meta style headers", () => {
    const m = guessMapping(["full_name", "phone_number", "email", "budget", "bhk", "city", "platform", "comments", "created_time"]);
    expect(m).toMatchObject({
      name: "full_name",
      phone: "phone_number",
      email: "email",
      budget: "budget",
      config: "bhk",
      location: "city",
      source: "platform",
      message: "comments",
      createdAt: "created_time",
    });
  });

  it("parses the sample and strips the p: prefix", () => {
    const sheet = parseText(sampleCsv(NOW));
    expect(sheet.rows).toHaveLength(18);
    expect(sheet.rows[0].phone_number).toBe("+919812045671");
  });

  it("explains empty and header-only files", () => {
    expect(() => parseText("   ")).toThrow(ImportError);
    expect(() => parseText("name,phone\n")).toThrow(/no leads/);
    expect(() => parseText("just one line of text")).toThrow(/could not find columns/);
  });

  it("handles quoted commas and a byte order mark", () => {
    const sheet = parseText('\uFEFFName,Phone,Notes\n"Rao, Kavita",9899012276,"wants 3 BHK, east facing"\n');
    expect(sheet.rows[0]).toEqual({ Name: "Rao, Kavita", Phone: "9899012276", Notes: "wants 3 BHK, east facing" });
  });
});

describe("scoreLeads", () => {
  const sheet = parseText(sampleCsv(NOW));
  const leads = rowsToLeads(sheet.rows, guessMapping(sheet.headers));
  const scored = scoreLeads(leads, SAMPLE_SETTINGS, NOW);
  const byName = (name: string) => scored.filter((s) => s.lead.name === name);

  it("puts a hot, well-fitting enquiry first", () => {
    expect(scored[0].bucket).toBe("call_today");
    expect(["Rohit Sharma", "Priya Menon", "Arjun Mehta"]).toContain(scored[0].lead.name);
  });

  it("keeps the newest of two enquiries from one number and skips the other", () => {
    const [a, b] = byName("Rohit Sharma");
    expect([a.bucket, b.bucket].filter((x) => x === "skip")).toHaveLength(1);
    const dup = a.duplicateOf ? a : b;
    expect(dup.reasons[0].text).toMatch(/Duplicate/);
  });

  it("skips brokers, job seekers, junk numbers and the not interested", () => {
    expect(byName("Vivek Gupta")[0].bucket).toBe("skip");
    expect(byName("Deepa Nair")[0].bucket).toBe("skip");
    expect(byName("Karan Malhotra")[0].bucket).toBe("skip");
    expect(byName("Ritu Bansal")[0].bucket).toBe("skip");
    expect(byName("Anjali Singh")[0].bucket).toBe("skip");
  });

  it("keeps an email-only lead reachable but below call today", () => {
    const tarun = byName("Tarun Khanna")[0];
    expect(tarun.bucket).not.toBe("skip");
    expect(tarun.bucket).not.toBe("call_today");
  });

  it("flags international numbers", () => {
    expect(byName("Sneha Kapoor")[0].international).toBe(true);
  });

  it("ranks a low budget below a matching one", () => {
    const low = byName("Kavita Rao")[0];
    const good = byName("Arjun Mehta")[0];
    expect(good.score).toBeGreaterThan(low.score);
    expect(low.fit).toBeLessThan(40);
  });

  it("gives every lead at least one reason when it is skipped", () => {
    for (const s of scored.filter((x) => x.bucket === "skip")) expect(s.reasons.length).toBeGreaterThan(0);
  });

  it("is stable and bounded", () => {
    for (const s of scored) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
    }
    expect(scoreLeads(leads, SAMPLE_SETTINGS, NOW).map((s) => s.lead.id)).toEqual(scored.map((s) => s.lead.id));
  });

  it("still ranks when no project details are set", () => {
    const out = scoreLeads([lead({ message: "site visit please", createdAt: "2026-11-20 09:00" })], {
      projectName: "",
      agentName: "",
      priceMinLakh: 0,
      priceMaxLakh: 0,
      configs: [],
      locations: [],
    }, NOW);
    expect(out[0].fit).toBe(50);
    expect(out[0].bucket).not.toBe("skip");
  });

  it("moves a lead to skip once marked not interested", () => {
    const out = scoreLeads([lead({ status: "not_interested", message: "site visit", budget: "2 cr" })], SAMPLE_SETTINGS, NOW);
    expect(out[0].bucket).toBe("skip");
  });
});

describe("parseDate", () => {
  it("reads ISO and Indian day-first dates", () => {
    expect(parseDate("2026-11-20 09:00")).not.toBeNull();
    expect(new Date(parseDate("18/11/2026")!).getMonth()).toBe(10);
    expect(parseDate("nonsense")).toBeNull();
  });
});

describe("export and storage", () => {
  it("neutralises spreadsheet formulas", () => {
    const out = scoreLeads([lead({ name: "=HYPERLINK(\"http://x\")", message: "+cmd" })], SAMPLE_SETTINGS, NOW);
    const csv = toCsv(out);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+cmd");
  });

  it("repairs damaged saved data instead of crashing", () => {
    expect(reviveState(null)).toBeNull();
    const revived = reviveState({ settings: { priceMinLakh: "x", configs: [1, "3 BHK"] }, leads: [{ id: "a", status: "weird" }, 5, {}] });
    expect(revived?.settings.priceMinLakh).toBe(0);
    expect(revived?.settings.configs).toEqual(["3 BHK"]);
    expect(revived?.leads).toHaveLength(1);
    expect(revived?.leads[0].status).toBe("new");
  });

  it("drafts a message that uses the first name and project", () => {
    const [s] = scoreLeads([lead({ name: "Priya Menon", config: "4 BHK" })], SAMPLE_SETTINGS, NOW);
    const text = draftMessage(s, SAMPLE_SETTINGS);
    expect(text).toContain("Hi Priya");
    expect(text).toContain("Skyline Residences");
  });
});
