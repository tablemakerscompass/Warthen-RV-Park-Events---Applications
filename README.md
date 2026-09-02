# Warthen RV Park Events — Vendor Applications

A custom web application built for Warthen RV Park to streamline vendor signup and payment for their events.

## The Problem
Warthen RV Park needed a way for event vendors to sign up and pay online — without the event planner manually chasing down information from each vendor one by one.

## What I Built
A vendor application system where vendors submit all their information directly through the site, with an automatic email notification sent to the event planner for each new application. Vendors could also handle payment through the platform.

## The Result
- Eliminated manual back-and-forth for vendor intake
- The event planner secured **over 10 vendors in a single week**
- Freed up the planner's time to focus on event logistics instead of paperwork


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

Every application is pushed through **two independent delivery channels**, in
order, so one outage never loses a vendor. On submit the browser:

1. Validates all fields and rejects spam via a hidden honeypot.
2. Renders a printable **PDF copy** of the application (jsPDF).
3. **Channel 1 — `/api/submit`.** POSTs the application plus the PDF to the
   Vercel function, which emails it to `sisterrosellc@gmail.com` (CC
   `the5loavesagency@gmail.com`) through [Resend](https://resend.com) with the
   PDF attached, sends the applicant a confirmation, and optionally stores the
   record in Supabase. Requires `RESEND_API_KEY` and `MAIL_FROM` — see
   [Deploy to Vercel](#deploy-to-vercel).
4. **Channel 2 — [FormSubmit](https://formsubmit.co).** If channel 1 is not
   configured or fails, the application is POSTed to FormSubmit's AJAX endpoint,
   which emails it to `sisterrosellc@gmail.com` as a formatted table with
   subject `New Vendor Application – [Business Name]`, CCs
   `the5loavesagency@gmail.com`, and sends the applicant an automatic
   confirmation (`_autoresponse`).
5. **Last resort.** If *both* channels fail, the confirmation screen shows a
   warning instead of a success message, downloads the PDF, and opens a
   pre-filled email to the administrator so the vendor knows to send it manually.

### Delivery is confirmed, not assumed

A channel counts as delivered **only when its response body says so** — the
function must return `emailed: true`, and FormSubmit must return
`success: "true"`. FormSubmit answers **HTTP 200 with `{"success":"false"}`**
when the recipient address has never been activated, when the form has been
disabled, or when it is rate-limiting; treating that as success is what makes a
site look like it is working while the promoter's inbox stays empty.

## Troubleshooting: vendors submit but no email arrives

Work through these in order:

1. **FormSubmit activation.** The first-ever submission to a new recipient
   triggers a one-time activation email to `sisterrosellc@gmail.com` from
   FormSubmit. Until someone clicks that link, **every** submission is silently
   discarded. Check the inbox *and the spam folder* for it. If it can't be
   found, submit the form once more to re-trigger it.
2. **Gmail spam / Promotions.** Search Gmail for
   `from:formsubmit.co OR subject:"New Vendor Application"` including spam and
   all mail — the messages are often filed there rather than missing.
3. **Watch the response.** Open the site, submit a test application, and check
   the browser console. Failed deliveries now log
   `Fallback delivery (FormSubmit) failed: formsubmit rejected: …` with the
   reason FormSubmit gave, and the vendor sees the warning screen.
4. **Turn on Resend (channel 1)** so delivery no longer depends on FormSubmit:
   add `RESEND_API_KEY` and `MAIL_FROM` in Vercel and redeploy. This channel
   also attaches the PDF and can store every application in Supabase, so
   applications survive even if all email fails.

### Optional: Supabase storage

The Vercel function can also **save every application to a database**, which
gives the promoter a durable record independent of email — see
[`.env.example`](.env.example) and [`supabase/schema.sql`](supabase/schema.sql).

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
   | `ADMIN_CC` | Extra recipients, comma separated (defaults to `the5loavesagency@gmail.com`) |
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
