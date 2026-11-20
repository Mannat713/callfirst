# CallFirst

**Know which lead to call first.** CallFirst turns a messy real estate lead export into a ranked call list. Every lead is scored on intent and budget fit, and the reason for each rank is shown.

It runs entirely in the browser. Lead files are never uploaded; there is no server, account or database.

## Who it is for

Sales teams at real estate developers and brokerages who get a CSV of enquiries from Meta, Google, property portals or a CRM and have to decide who to phone first.

## What it does

- **Imports** a CSV (or rows pasted from a spreadsheet) and works out which column is which. The mapping can be corrected by hand.
- **Cleans** the list: normalises Indian and international phone numbers, and sets aside duplicates, fake numbers, brokers, job seekers and people who said they are not interested.
- **Scores** every lead out of 100 from two parts:
  - *Intent*: how recent the enquiry is, what the buyer wrote, and where they came from.
  - *Fit*: budget, configuration and city compared with the project you describe.
- **Explains** each rank with the rules that fired.
- **Tracks** call status and notes, saved in the browser.
- **Drafts** a WhatsApp follow-up per lead and opens the dialler or WhatsApp in one click.
- **Exports** the ranked list with scores, statuses and notes as a CSV.

Scoring uses fixed rules, not a language model, so the same file always produces the same order and every rank can be explained.

## Stack

- [Next.js](https://nextjs.org) (App Router) with React and TypeScript
- Tailwind CSS
- Papa Parse for CSV reading and writing
- Vitest for unit tests
- Deployed as static pages; no backend services

## Project layout

```
src/app/(site)      Landing page, blog and privacy page (analytics loads here only)
src/app/app         The tool
src/components/app  Import, column setup, ranked list and lead panel
src/lib             Parsing, phone and budget handling, scoring, storage, export
src/content         Blog posts
```

## Run it locally

Requires Node 20.9 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Checks

```bash
npm run check
```

This runs lint, type checking, the unit tests and a production build. The same steps run in GitHub Actions on every push.

## Configuration

Copy `.env.example` to `.env.local` for local use, or set the same names in your host's dashboard.

| Name | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes, in production | Live address, used in the sitemap, robots.txt and share links |
| `NEXT_PUBLIC_CLARITY_ID` | No | Microsoft Clarity project ID. Loaded on public pages only, never on `/app` |
| `NEXT_PUBLIC_GSC_VERIFICATION` | No | Google Search Console verification code |

## Deploying

See [DEPLOY.md](./DEPLOY.md) for a step by step guide to GitHub, Vercel and a custom domain.

## Privacy and limits

- Files up to 8 MB and 5,000 leads per import.
- `.xlsx` files are not read directly; save them as CSV first.
- Data is stored in the browser's local storage on one device. Clearing browser data removes it.
- Exported CSVs prefix cells that begin with `=`, `+`, `-` or `@` so spreadsheets do not run them as formulas.

## Built with AI

This project was built with an AI coding assistant (Claude) under human direction, including the code, tests and written content.

## Licence

MIT
