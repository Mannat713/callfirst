import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { POSTS } from "@/content/posts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const PREVIEW = [
  { rank: 1, name: "Rohit Sharma", meta: "+91 98120 45671 · 3 BHK · 1.8 Cr · Gurugram", bucket: "Call today", chip: "bg-accent-soft text-accent-strong", bar: "bg-accent", score: 100, good: true, reasons: ["Enquired in the last 24 hours", "Asked about a site visit", "Budget fits the price range"] },
  { rank: 3, name: "Priya Menon", meta: "+91 98200 11432 · 4 BHK · 2 - 2.5 cr · Gurugram", bucket: "Call today", chip: "bg-accent-soft text-accent-strong", bar: "bg-accent", score: 91, good: true, reasons: ["Wants a call back soon", "Wants 4 BHK, which you sell"] },
  { rank: 11, name: "Amit Verma", meta: "+91 98110 55234 · 2 BHK · 90 lakh · Faridabad", bucket: "Nurture", chip: "bg-calm-soft text-calm", bar: "bg-calm", score: 40, good: false, reasons: ["Budget ₹90 L is well below ₹1.5 Cr", "Wants 2 BHK, not on offer"] },
  { rank: 14, name: "Vivek Gupta", meta: "+91 96500 88712 · 3 BHK · Gurugram", bucket: "Skip", chip: "bg-stop-soft text-stop", bar: "bg-stop", score: 20, good: false, reasons: ["Looks like a broker, not a buyer"] },
];

const STEPS = [
  { n: "1", title: "Drop in your export", text: "A CSV from Meta, Google, a property portal or your CRM. CallFirst works out which column is which." },
  { n: "2", title: "Say what you are selling", text: "Price range, configurations and cities. This is what fit is judged against, and you can change it any time." },
  { n: "3", title: "Call from the top", text: "Every lead is ranked and explained. Mark the outcome, add a note, send a WhatsApp follow-up in one click." },
];

const CHECKS = [
  ["Removes the noise", "Duplicate enquiries, fake numbers, brokers and job seekers are moved to Skip before they cost you a call."],
  ["Reads intent", "Recent enquiries, site visit requests and payment plan questions rise. Blank forms from a week ago sink."],
  ["Checks fit", "Budgets typed as \"1.5 Cr\", \"80-90 lakh\" or \"₹1,20,00,000\" are all understood and compared with your price range."],
  ["Shows its reasons", "No black box. Each rank lists what counted for and against, so your team can overrule it when they know better."],
  ["Keeps your place", "Statuses and notes are saved in your browser. Close the tab at lunch and carry on where you stopped."],
  ["Goes back out", "Export the ranked list with scores, statuses and notes as a CSV for your CRM or your manager."],
];

const FAQ = [
  ["Is my lead data uploaded anywhere?", "No. The file is read by your browser on your own device. There is no server that receives it, and analytics is not loaded on the app page."],
  ["Which files does it accept?", "CSV files up to 8 MB and 5,000 leads, or rows pasted from Excel or Google Sheets. If you have an .xlsx file, save it as CSV first."],
  ["How is the score worked out?", "Two parts. Intent looks at how recent the enquiry is, what the buyer wrote and where they came from. Fit compares budget, configuration and city with your project. The app shows the reasons beside every lead."],
  ["Does it use AI to score leads?", "No. Scoring uses fixed rules, so the same file always gives the same order and every rank can be explained."],
  ["What does it cost?", "CallFirst is free to use."],
];

export default function Home() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: SITE_DESCRIPTION,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 lg:grid-cols-[1fr_1.05fr] lg:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm text-muted">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            For real estate sales teams
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Know which lead to call first.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Upload the messy lead sheet from your ads. CallFirst removes the duplicates and dead numbers, scores every buyer on
            intent and budget fit, and hands you a call list in order, with the reason for each rank.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/app" size="lg">Rank my leads</ButtonLink>
            <ButtonLink href="/app?sample=1" size="lg" kind="secondary">Try with sample leads</ButtonLink>
          </div>
          <p className="mt-4 text-sm text-muted">Free. No sign-up. Your file never leaves your browser.</p>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-4 shadow-[0_30px_80px_-30px_rgba(20,23,26,0.25)] sm:p-5" aria-label="Example of a ranked call list">
          <div className="grid grid-cols-4 gap-2">
            {[["Call today", "6", "bg-accent-soft text-accent-strong"], ["This week", "3", "bg-warn-soft text-warn"], ["Nurture", "3", "bg-calm-soft text-calm"], ["Skip", "6", "bg-stop-soft text-stop"]].map(([label, n, chip]) => (
              <div key={label} className="rounded-xl border border-line p-2.5 sm:p-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${chip}`}>{label}</span>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{n}</p>
              </div>
            ))}
          </div>
          <ol className="mt-3 space-y-2">
            {PREVIEW.map((row) => (
              <li key={row.rank} className="rounded-xl border border-line p-3">
                <div className="flex items-start gap-3">
                  <span className="w-5 pt-0.5 font-mono text-xs text-faint">{row.rank}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{row.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${row.chip}`}>{row.bucket}</span>
                    </div>
                    <p className="truncate text-xs text-muted">{row.meta}</p>
                    <ul className="mt-1.5 flex flex-wrap gap-1">
                      {row.reasons.map((r) => (
                        <li key={r} className={`rounded-md px-1.5 py-0.5 text-[11px] ${row.good ? "bg-accent-soft text-accent-strong" : "bg-stop-soft text-stop"}`}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-sm font-semibold tabular-nums">{row.score}</span>
                    <span className="hidden h-1.5 w-10 overflow-hidden rounded-full bg-line sm:block" aria-hidden="true">
                      <span className={`block h-full ${row.bar}`} style={{ width: `${row.score}%` }} />
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
          {[["18 leads in", "The sample export: mixed formats, repeats and junk."], ["6 set aside", "Duplicates, fake numbers, a broker and a job seeker."], ["6 to call today", "Asked a buying question and can afford the home."]].map(([big, small]) => (
            <div key={big}>
              <p className="text-3xl font-semibold tracking-tight">{big}</p>
              <p className="mt-1 text-muted">{small}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">From export to first call in under a minute</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-2xl border border-line bg-surface p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-mono text-sm text-white">{s.n}</span>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">What it does to your sheet</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {CHECKS.map(([title, text]) => (
              <div key={title}>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0e7a53" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500" /></svg>
                  {title}
                </h3>
                <p className="mt-2 text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your buyers&apos; numbers are not our business</h2>
          <p className="mt-4 text-lg text-muted">
            A lead sheet is a list of people who trusted you with their phone number. CallFirst reads it on your device and keeps it
            there. There is no account, no upload and no database on our side.
          </p>
          <Link href="/privacy" className="mt-4 inline-block font-medium text-accent underline underline-offset-4">Read the privacy note</Link>
        </div>
        <ul className="space-y-3">
          {[["Read in the browser", "The CSV is parsed by the page you are looking at."], ["Saved on this device", "Statuses and notes live in your browser storage until you clear them."], ["No recording on the app", "Analytics runs on the public pages only, never where leads are shown."]].map(([t, d]) => (
            <li key={t} className="rounded-2xl border border-line bg-surface p-5">
              <p className="font-semibold">{t}</p>
              <p className="mt-1 text-muted">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-5 py-20">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Questions</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                  {q}
                  <span aria-hidden="true" className="text-faint transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">From the blog</h2>
          <Link href="/blog" className="font-medium text-accent underline underline-offset-4">All posts</Link>
        </div>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {POSTS.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="block h-full rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-faint">
                <h3 className="text-lg font-semibold tracking-tight">{post.title}</h3>
                <p className="mt-2 text-sm text-muted">{post.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="rounded-3xl bg-ink px-6 py-14 text-center text-white">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your next call should be your best lead.</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">Upload a sheet and see the order in seconds.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/app" size="lg">Rank my leads</ButtonLink>
            <ButtonLink href="/app?sample=1" size="lg" kind="secondary">Try with sample leads</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
