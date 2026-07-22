# The Motown Review — Vendor Application Landing Page

A polished, mobile-responsive vendor application landing page for
**The Warthen RV Summer Music Festival Presents: The Motown Review — A Tribute
to Berry Gordy**, featuring The Band of the South.

**Event:** Saturday, September 19 · Warthen RV Park · 9470 S. Sparta Davisboro
Road, Warthen, GA 31094

> **Note:** GitHub only stores the source. To view the actual page, deploy it
> (see [Deploy to Vercel](#deploy-to-vercel)) or open `index.html` locally.
> The event flyer is not committed — drop it in at `assets/img/flyer.jpg` and a
> styled CSS stand-in is used until then.

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

Applications are emailed through **[FormSubmit](https://formsubmit.co)** — a free
service that needs **no account and no API key**. On submit the browser:

1. Validates all fields and rejects spam via a hidden honeypot.
2. POSTs the completed application to FormSubmit's AJAX endpoint, which emails it
   to `sisterrosellc@gmail.com` with subject `New Vendor Application – [Business Name]`,
   formatted as a table.
3. Sends the applicant an automatic confirmation email (FormSubmit
   `_autoresponse`).
4. Renders a printable **PDF copy** the vendor can download from the confirmation
   screen for their records.

> **One-time activation:** the very first submission triggers a FormSubmit
> confirmation email to `sisterrosellc@gmail.com`. Click the activation link once,
> and every submission after that flows straight to the inbox.

**Never a dead end.** If FormSubmit is ever unreachable, the page falls back to
generating the PDF locally, downloading it, and opening a pre-filled email to the
administrator.

### Optional: `/api/submit` (Supabase storage)

The repo also includes a dependency-free Vercel function at `api/submit.js` for
teams who additionally want to **save every application to a database** (Supabase)
or send email via Resend. It is not required for the email flow above — see
[`.env.example`](.env.example) and [`supabase/schema.sql`](supabase/schema.sql) to
enable it.

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
