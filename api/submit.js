// ============================================================
//  THE MOTOWN REVIEW — Vendor Application submission handler
//  Vercel Serverless Function (Node.js runtime)
//
//  Responsibilities:
//   1. Validate the incoming application + reject spam (honeypot).
//   2. Persist to Supabase (optional — only if env vars are set).
//   3. Email the completed application + PDF to the administrator.
//   4. Send a confirmation email to the applicant.
//   5. Record submission date/time and IP address.
//
//  All external integrations are OPTIONAL and controlled by env vars.
//  If nothing is configured the function still returns 200 with
//  { emailed:false } so the front-end shows the mailto fallback.
//
//  Environment variables (set in Vercel → Project → Settings → Env):
//    RESEND_API_KEY        Resend API key (email delivery)
//    MAIL_FROM             Verified sender, e.g. "Warthen RV Park <vendors@yourdomain.com>"
//    ADMIN_EMAIL           Defaults to sisterrosellc@gmail.com
//    ADMIN_CC              Extra recipients, comma separated
//                          (defaults to the5loavesagency@gmail.com)
//    SUPABASE_URL         e.g. https://xxxx.supabase.co
//    SUPABASE_SERVICE_KEY  Supabase service-role key (server-side only)
//    SUPABASE_TABLE        Defaults to "vendor_applications"
// ============================================================

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "sisterrosellc@gmail.com";
// Comma-separated extra recipients. Set ADMIN_CC="" to send to ADMIN_EMAIL only.
const ADMIN_CC = (process.env.ADMIN_CC === undefined
  ? "the5loavesagency@gmail.com"
  : process.env.ADMIN_CC)
  .split(",").map(function (s) { return s.trim(); }).filter(Boolean);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const app = body.application || {};
  const pdfBase64 = body.pdfBase64 || null;

  // --- Spam trap ---
  if (app.honeypot) {
    return res.status(200).json({ ok: true, emailed: false, note: "ignored" });
  }

  // --- Minimal server-side validation ---
  const required = ["businessName", "contactName", "phone", "email", "products"];
  for (const key of required) {
    if (!app[key] || String(app[key]).trim() === "") {
      return res.status(400).json({ ok: false, error: "Missing required field: " + key });
    }
  }

  // --- Capture metadata ---
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    (req.socket && req.socket.remoteAddress) ||
    "";
  const record = Object.assign({}, app, {
    ip_address: ip,
    status: app.status || "Pending Review",
    submitted_at: app.submittedAt || new Date().toISOString()
  });

  const results = { ok: true, emailed: false, stored: false };

  // --- 1. Persist to Supabase (optional) ---
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      await storeSupabase(record);
      results.stored = true;
    }
  } catch (e) {
    console.error("Supabase store failed:", e.message);
    results.storeError = e.message;
  }

  // --- 2. Email via Resend (optional) ---
  try {
    if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
      await sendAdminEmail(record, pdfBase64);
      // Confirmation to applicant — non-fatal if it fails
      try { await sendApplicantEmail(record); } catch (e) { console.error("Applicant email failed:", e.message); }
      results.emailed = true;
    } else {
      // Not an error — the front-end falls back to its own delivery channel.
      results.emailError = "Email is not configured (RESEND_API_KEY / MAIL_FROM are unset).";
      console.warn(results.emailError);
    }
  } catch (e) {
    console.error("Admin email failed:", e.message);
    results.emailError = e.message;
  }

  return res.status(200).json(results);
};

// ---------------------------------------------------------------
//  Supabase (REST — no SDK dependency)
// ---------------------------------------------------------------
async function storeSupabase(record) {
  const table = process.env.SUPABASE_TABLE || "vendor_applications";
  const url = process.env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + table;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: "Bearer " + process.env.SUPABASE_SERVICE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify([toDbRow(record)])
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Supabase " + res.status + ": " + txt);
  }
}

function toDbRow(r) {
  return {
    business_name: r.businessName,
    contact_name: r.contactName,
    phone: r.phone,
    email: r.email,
    address: r.address,
    city: r.city,
    state: r.state,
    zip: r.zip,
    website: r.website,
    facebook: r.facebook,
    instagram: r.instagram,
    tiktok: r.tiktok,
    category: r.category,
    products: r.products,
    booth_length: r.boothLength,
    booth_width: r.boothWidth,
    booth_size: r.boothSize,
    electricity: r.electricity,
    electricity_details: r.electricityDetails,
    bringing: r.bring,
    setup_requests: r.setupRequests,
    emergency_name: r.emergencyName,
    emergency_relationship: r.emergencyRelationship,
    emergency_phone: r.emergencyPhone,
    agree_guidelines: r.agreeGuidelines,
    agree_release: r.agreeRelease,
    signature: r.signature,
    printed_name: r.printedName,
    sign_date: r.signDate || null,
    ip_address: r.ip_address,
    status: r.status,
    submitted_at: r.submitted_at
  };
}

// ---------------------------------------------------------------
//  Resend email (REST — no SDK dependency)
// ---------------------------------------------------------------
async function resendSend(payload) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Resend " + res.status + ": " + txt);
  }
  return res.json();
}

async function sendAdminEmail(r, pdfBase64) {
  const payload = {
    from: process.env.MAIL_FROM,
    to: [ADMIN_EMAIL],
    reply_to: r.email,
    subject: "New Vendor Application – " + r.businessName,
    html: adminHtml(r)
  };
  if (ADMIN_CC.length) payload.cc = ADMIN_CC;
  if (pdfBase64) {
    payload.attachments = [{
      filename: "Vendor-Application-" + slug(r.businessName) + ".pdf",
      content: pdfBase64
    }];
  }
  return resendSend(payload);
}

async function sendApplicantEmail(r) {
  return resendSend({
    from: process.env.MAIL_FROM,
    to: [r.email],
    subject: "We received your vendor application – The Motown Review",
    html: applicantHtml(r)
  });
}

// ---------------------------------------------------------------
//  Email templates
// ---------------------------------------------------------------
function row(label, value) {
  if (!value) value = "—";
  return '<tr><td style="padding:6px 12px;font:600 12px Arial;color:#8a6a3d;text-transform:uppercase;white-space:nowrap;vertical-align:top">' +
    esc(label) + '</td><td style="padding:6px 12px;font:14px Arial;color:#241812">' + esc(value) + "</td></tr>";
}

function adminHtml(r) {
  return [
    '<div style="background:#0b0705;padding:24px;font-family:Arial,sans-serif">',
    '<div style="max-width:640px;margin:0 auto;background:#fdf9ef;border-radius:14px;overflow:hidden;border:1px solid #d4af37">',
    '<div style="background:#591420;padding:20px 24px">',
    '<div style="color:#eacb6b;font:700 20px Georgia,serif">THE MOTOWN REVIEW</div>',
    '<div style="color:#f6ecd6;font:13px Arial">New Vendor Application &middot; Warthen RV Park</div>',
    "</div>",
    '<table style="width:100%;border-collapse:collapse">',
    row("Business Name", r.businessName),
    row("Owner / Contact", r.contactName),
    row("Phone", r.phone),
    row("Email", r.email),
    row("Vendor Category", r.category),
    row("Booth Size", r.boothSize),
    row("Electricity", r.electricity + (r.electricityDetails ? " — " + r.electricityDetails : "")),
    row("Products / Services", r.products),
    row("Bringing", r.bring),
    row("Emergency Contact", [r.emergencyName, r.emergencyRelationship, r.emergencyPhone].filter(Boolean).join(" · ")),
    row("Signature", r.signature),
    row("Status", r.status),
    row("Submitted", r.submittedAtLocal || r.submitted_at),
    row("IP Address", r.ip_address),
    "</table>",
    '<div style="padding:14px 24px;font:12px Arial;color:#8a6a3d;border-top:1px solid #e6d6ad">A printable PDF copy is attached to this email.</div>',
    "</div></div>"
  ].join("");
}

function applicantHtml(r) {
  return [
    '<div style="background:#0b0705;padding:24px;font-family:Arial,sans-serif">',
    '<div style="max-width:560px;margin:0 auto;background:#fdf9ef;border-radius:14px;overflow:hidden;border:1px solid #d4af37">',
    '<div style="background:#591420;padding:22px 24px;text-align:center">',
    '<div style="color:#eacb6b;font:700 22px Georgia,serif">Thank You! 🎵</div>',
    "</div>",
    '<div style="padding:24px;color:#241812;font:15px/1.6 Arial">',
    "<p>Hi " + esc(r.contactName) + ",</p>",
    "<p>Your vendor application for <strong>The Motown Review: A Tribute to Berry Gordy</strong> has been received. Our team will review it and contact you regarding your acceptance.</p>",
    '<table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fff;border:1px solid #e6d6ad;border-radius:8px">',
    row("Event", "Saturday, September 19 · Warthen RV Park"),
    row("Vendor Fee", "$75"),
    row("Cash App", "$warthenrvpark (include your Business Name in the notes)"),
    row("Your Business", r.businessName),
    "</table>",
    "<p>Questions? Call <strong>478-201-7610</strong> or follow us <strong>@warthenrvpark</strong>.</p>",
    "<p style=\"color:#8a6a3d\">— Warthen RV Park</p>",
    "</div></div></div>"
  ].join("");
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function slug(s) {
  return String(s || "vendor").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}
