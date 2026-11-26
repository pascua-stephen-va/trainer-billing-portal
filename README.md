# Trainer Billing & Invoice System

Material 3 Expressive billing and statement of account web application tailored for **Virtual Assistant Services Level III** trainers (18 training days · 3 hours/day · 54 total hours).

## Features

- **18-Day Split & Staggered Cohort Tranches:** Switch globally or per batch between 1st Half (Days 1–9, `-A`), 2nd Half (Days 10–18, `-B`), and Full Term (Days 1–18, `-FULL`), with automatic `-MIX` invoice numbering and per-cohort 18-day progress bars when cohorts overlap.
- **Multi-Batch Support (Up to 4 Batches):** Add up to 4 `VA-L3-2026-B` batches on a single statement, each with its own tranche, interactive From/To calendar date picker, and optional price overwrite.
- **Rate per Half, Payment Terms & Tax-Exempt Reimbursements:** Calculate fees using **Rate per Half** (9 days / 27 hours), set Payment Terms / Due Dates (`Due on Receipt`, `Net 7`, `Net 15`, `Net 30`, or Custom), apply `0%`, `5%`, or `10%` EWT strictly to taxable fees, and itemize tax-free reimbursements.
- **Optional E-Signature & Single-Page A4 Print Safeguards:** Upload a transparent PNG signature above the Trainer signatory line and export cleanly to a single-page A4 PDF with automatic dense-print spacing and page-break protection for 3–4 batches.
- **Invoice History & One-Click Clone to 2nd Half:** Store statements locally with `Draft / Sent / Paid` status tracking, JSON backup export/import, and one-click **Clone → 2nd Half** conversion.
- **Multi-Bank Remittance & Smart QR Ph Cropper:** Supports MariBank, Wise, GoTyme, GCash, Maya, BPI, BDO, UnionBank, and Custom Banks, paired with an interactive canvas cropper and Light / High-Contrast Dark / Auto themes.

## Local Development

```bash
npm install --legacy-peer-deps
npm run dev
```

## Scripts

- `npm run dev` — Start development server on port 3000
- `npm test` — Run billing logic unit tests (`node:test` via `tsx`)
- `npm run lint` — TypeScript typecheck (`tsc --noEmit`)
- `npm run build` — Build static production bundle into `./dist`

## GitHub Pages Deployment

The included `.github/workflows/deploy.yml` workflow automatically runs `npm install --legacy-peer-deps`, tests, typechecks, builds `./dist`, and deploys to GitHub Pages on pushes to `main`. In your repository settings, set **Settings → Pages → Source** to **GitHub Actions**.
