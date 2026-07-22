# The Motown Review — Vendor Application Landing Page

A polished, mobile-responsive vendor application landing page for
**The Warthen RV Summer Music Festival Presents: The Motown Review — A Tribute
to Berry Gordy**, featuring The Band of the South.

**Event:** Saturday, September 19 · Warthen RV Park · 9470 S. Sparta Davisboro
Road, Warthen, GA 31094

![vintage Motown themed — black, deep burgundy, warm gold, cream](assets/img/flyer.jpg)

---

## What's here

```
index.html              The full single-page site (hero, about, form, footer)
assets/css/styles.css   All styling — vintage Motown / Southern-charm theme
assets/js/app.js        Validation, conditional fields, animations, PDF, submit
assets/img/flyer.jpg    ← add the event flyer here (see assets/img/README.md)
api/submit.js           Vercel serverless function: email + storage + PDF attach
supabase/schema.sql     Optional database table for saved applications
vercel.json             Vercel config
.env.example            Environment variables reference
```

## Features

- **Design** — vintage Motown aesthetic (black, deep burgundy, warm gold, cream,
  bronze) with vinyl records, musical notes, stage lighting, and gold dividers.
  Fully responsive for desktop, tablet, and mobile.
- **Hero** — event flyer, headline, key facts, highlight cards (fee, deadline,
  booth size, Cash App), and a smooth-scroll “Apply” button.
- **Application form** — business info, vendor category (with conditional
  “Other”), products, booth info (16 ft max, enforced), electricity (conditional
  details), emergency contact, guidelines acknowledgement, and liability release
  with digital signature.
- **UX** — subtle fade-in reveals, modern inputs, inline validation messages, a
  loading spinner, duplicate-submission prevention, and full keyboard/ARIA
  accessibility.
- **Confirmation screen** — themed thank-you with event/payment details and an
  optional “Download PDF copy” button.
- **Client-side PDF** — every application is rendered to a printable PDF
  (jsPDF) and attached to the administrator email.

## How submission works

On submit the browser POSTs the application (plus a base64 PDF) to
`/api/submit`. That function:

1. Validates the payload and rejects spam (honeypot).
2. Saves the application to Supabase (if configured) with status
   **“Pending Review”**, capturing submission date/time and IP address.
3. Emails the completed application **and the PDF** to
   `sisterrosellc@gmail.com` with subject `New Vendor Application – [Business Name]`.
4. Sends an automatic confirmation email to the applicant.

**No backend required to demo it.** If `/api/submit` isn’t deployed or no email
provider is configured, the page automatically falls back to generating the PDF
locally, downloading it, and opening a pre-filled email to the administrator —
so the form is never a dead end.

## Deploy to Vercel

1. Push this repo to GitHub (already done on the working branch).
2. In Vercel, **Import** the repo — it deploys as a static site with the
   `api/submit.js` function; no build step needed.
3. Add environment variables (Project → Settings → Environment Variables), all
   optional — see [`.env.example`](.env.example):

   | Variable | Purpose |
   |---|---|
   | `RESEND_API_KEY` | Email delivery via [Resend](https://resend.com) |
   | `MAIL_FROM` | Verified sender, e.g. `Warthen RV Park <vendors@yourdomain.com>` |
   | `ADMIN_EMAIL` | Recipient (defaults to `sisterrosellc@gmail.com`) |
   | `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Optional application storage |
   | `SUPABASE_TABLE` | Defaults to `vendor_applications` |

4. (Optional) Create the database table by running
   [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.

> Email uses Resend’s REST API and storage uses Supabase’s REST API directly, so
> there are **no npm dependencies to install** — the function runs on Vercel’s
> default Node runtime as-is.

## Local preview

Open `index.html` directly in a browser, or serve the folder:

```bash
npx serve .
```

The design, form, validation, and PDF/mailto fallback all work without any
backend. To exercise `/api/submit` locally, run `vercel dev`.

## Notes

- Add the event flyer at `assets/img/flyer.jpg` (a styled stand-in renders
  automatically if it’s missing).
- Booth dimensions are capped at 16 feet in the UI and re-checked on the server.
- The Supabase table has RLS enabled; only the server-side service role can read
  or write it.
