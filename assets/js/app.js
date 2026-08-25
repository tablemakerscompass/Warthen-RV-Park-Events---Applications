/* ============================================================
   THE MOTOWN REVIEW — Vendor Application  ·  app.js
   ============================================================ */
(function () {
  "use strict";

  var MAX_BOOTH = 16;
  var form = document.getElementById("vendorForm");
  var submitBtn = document.getElementById("submitBtn");
  var confirmScreen = document.getElementById("confirmScreen");
  var errorSummary = document.getElementById("formErrorSummary");
  var submitting = false;
  var lastPayload = null;

  /* ---------- Year + default date ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  var signDate = document.getElementById("signDate");
  if (signDate && !signDate.value) {
    signDate.value = new Date().toISOString().slice(0, 10);
  }

  /* ---------- Flyer fallback ---------- */
  var flyerImg = document.getElementById("flyerImg");
  var flyerFallback = document.getElementById("flyerFallback");
  function showFlyerFallback() {
    flyerImg.classList.add("is-hidden");
    if (flyerFallback) {
      flyerFallback.classList.add("show");
      flyerFallback.removeAttribute("aria-hidden");
    }
  }
  if (flyerImg) {
    flyerImg.addEventListener("error", showFlyerFallback);
    // The error event may have already fired before this deferred script ran.
    if (flyerImg.complete && flyerImg.naturalWidth === 0) showFlyerFallback();
  }

  /* ---------- Payment proof form (screenshot upload) ---------- */
  var proofForm = document.getElementById("paymentProofForm");
  var proofNext = document.getElementById("proofNext");
  var paymentToast = document.getElementById("paymentToast");
  if (proofNext) {
    // Where FormSubmit sends the vendor back after the upload.
    proofNext.value = window.location.origin + window.location.pathname + "#payment-received";
  }
  if (proofForm) {
    proofForm.addEventListener("submit", function () {
      var btn = proofForm.querySelector(".proof-submit");
      if (btn) { btn.classList.add("is-loading"); btn.textContent = "Sending…"; }
    });
  }
  // Show the "payment received" banner when we return from FormSubmit.
  if (paymentToast && window.location.hash === "#payment-received") {
    paymentToast.hidden = false;
    if (history.replaceState) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setTimeout(function () { paymentToast.hidden = true; }, 9000);
  }
  var toastClose = document.getElementById("toastClose");
  if (toastClose) {
    toastClose.addEventListener("click", function () { paymentToast.hidden = true; });
  }

  /* ---------- Nav shadow on scroll ---------- */
  var nav = document.getElementById("siteNav");
  window.addEventListener("scroll", function () {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 20);
  }, { passive: true });

  /* ---------- Smooth scroll for in-page links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (link.classList.contains("js-scroll") && confirmScreen && !confirmScreen.hidden) {
        // Return-to-page from confirmation
        hideConfirmation();
      }
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Conditional: "Other" category ---------- */
  var otherWrap = document.getElementById("otherCategoryWrap");
  var categoryOther = document.getElementById("categoryOther");
  form.querySelectorAll('input[name="category"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      var isOther = form.querySelector('input[name="category"]:checked').value === "Other";
      toggle(otherWrap, isOther);
      if (categoryOther) categoryOther.required = isOther;
      if (!isOther && categoryOther) { categoryOther.value = ""; clearFieldError(categoryOther); }
      clearGroupError("category");
    });
  });

  /* ---------- Conditional: Electricity details ---------- */
  var elecWrap = document.getElementById("electricityWrap");
  var elecDetails = document.getElementById("electricityDetails");
  form.querySelectorAll('input[name="electricity"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      var isYes = radio.value === "Yes" && radio.checked;
      toggle(elecWrap, isYes);
      if (elecDetails) elecDetails.required = isYes;
      if (!isYes && elecDetails) { elecDetails.value = ""; clearFieldError(elecDetails); }
      clearGroupError("electricity");
    });
  });

  /* ---------- Booth size clamps ---------- */
  ["boothLength", "boothWidth"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", function () {
      var v = parseFloat(el.value);
      if (!isNaN(v) && v > MAX_BOOTH) { el.value = MAX_BOOTH; }
      if (!isNaN(v) && v < 0) { el.value = ""; }
    });
  });

  /* ---------- Clear errors as the user types ---------- */
  form.querySelectorAll("input, textarea").forEach(function (el) {
    el.addEventListener("input", function () { clearFieldError(el); });
    el.addEventListener("change", function () { clearFieldError(el); });
  });

  /* ---------- Clear agreement checkbox errors on check ---------- */
  ["agreeGuidelines", "agreeRelease"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", function () {
      var block = el.closest(".form-block");
      var err = block && (block.querySelector(".agree-check + [data-err]") || block.querySelector("[data-err]"));
      if (err) { err.textContent = ""; err.classList.remove("show"); }
    });
  });

  /* ---------- Helpers ---------- */
  function toggle(el, show) {
    if (!el) return;
    if (show) { el.hidden = false; }
    else { el.hidden = true; }
  }

  function fieldWrap(el) { return el.closest(".field"); }

  function setFieldError(el, msg) {
    var wrap = fieldWrap(el);
    if (wrap) {
      wrap.classList.add("invalid");
      var err = wrap.querySelector("[data-err]");
      if (err) { err.textContent = msg; err.classList.add("show"); }
    }
  }
  function clearFieldError(el) {
    var wrap = fieldWrap(el);
    if (wrap) {
      wrap.classList.remove("invalid");
      var err = wrap.querySelector("[data-err]");
      if (err) { err.textContent = ""; err.classList.remove("show"); }
    }
  }
  function setGroupError(name, msg) {
    var err = form.querySelector('[data-err-for="' + name + '"]');
    if (err) { err.textContent = msg; err.classList.add("show"); }
  }
  function clearGroupError(name) {
    var err = form.querySelector('[data-err-for="' + name + '"]');
    if (err) { err.textContent = ""; err.classList.remove("show"); }
  }

  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  /* ---------- Validation ---------- */
  function validate() {
    var problems = [];
    var firstBad = null;

    function fail(el, msg) {
      setFieldError(el, msg);
      problems.push(msg);
      if (!firstBad) firstBad = el;
    }

    // Required text/email/tel fields
    var required = [
      ["businessName", "Business name is required."],
      ["contactName", "Owner / contact name is required."],
      ["phone", "Phone number is required."],
      ["email", "Email address is required."],
      ["products", "Please describe your products or services."],
      ["boothLength", "Booth length is required."],
      ["boothWidth", "Booth width is required."],
      ["emergencyName", "Emergency contact name is required."],
      ["emergencyRelationship", "Relationship is required."],
      ["emergencyPhone", "Emergency contact phone is required."],
      ["signature", "A digital signature is required."],
      ["printedName", "Printed name is required."],
      ["signDate", "Date is required."]
    ];
    required.forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (el && !el.value.trim()) fail(el, pair[1]);
    });

    // Email format
    var email = document.getElementById("email");
    if (email && email.value.trim() && !isEmail(email.value.trim())) {
      fail(email, "Please enter a valid email address.");
    }

    // Booth size limits
    ["boothLength", "boothWidth"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.value.trim()) {
        var v = parseFloat(el.value);
        if (isNaN(v) || v <= 0) fail(el, "Enter a number greater than 0.");
        else if (v > MAX_BOOTH) fail(el, "Maximum booth size is 16 feet.");
      }
    });

    // Category radio
    var cat = form.querySelector('input[name="category"]:checked');
    if (!cat) {
      setGroupError("category", "Please select a vendor category.");
      problems.push("Vendor category is required.");
      if (!firstBad) firstBad = form.querySelector('input[name="category"]');
    } else if (cat.value === "Other" && categoryOther && !categoryOther.value.trim()) {
      fail(categoryOther, "Please specify your category.");
    }

    // Electricity radio
    var elec = form.querySelector('input[name="electricity"]:checked');
    if (!elec) {
      setGroupError("electricity", "Please indicate if you need electricity.");
      problems.push("Electricity selection is required.");
      if (!firstBad) firstBad = form.querySelector('input[name="electricity"]');
    } else if (elec.value === "Yes" && elecDetails && !elecDetails.value.trim()) {
      fail(elecDetails, "Please describe your electrical needs.");
    }

    // Agreement checkboxes
    var agreeG = document.getElementById("agreeGuidelines");
    if (agreeG && !agreeG.checked) {
      var wrapG = agreeG.closest(".form-block").querySelector("[data-err]");
      if (wrapG) { wrapG.textContent = "You must agree to the Vendor Guidelines."; wrapG.classList.add("show"); }
      problems.push("You must agree to the Vendor Guidelines.");
      if (!firstBad) firstBad = agreeG;
    }
    var agreeR = document.getElementById("agreeRelease");
    if (agreeR && !agreeR.checked) {
      var rErr = agreeR.closest(".form-block").querySelector(".agree-check + [data-err]");
      if (rErr) { rErr.textContent = "You must agree to the Liability Release."; rErr.classList.add("show"); }
      problems.push("You must agree to the Liability Release.");
      if (!firstBad) firstBad = agreeR;
    }

    return { ok: problems.length === 0, problems: problems, firstBad: firstBad };
  }

  /* ---------- Gather data ---------- */
  function gather() {
    var fd = new FormData(form);
    var bring = fd.getAll("bring");
    var category = fd.get("category") || "";
    if (category === "Other") {
      var other = (fd.get("categoryOther") || "").trim();
      if (other) category = "Other: " + other;
    }
    return {
      businessName: (fd.get("businessName") || "").trim(),
      contactName: (fd.get("contactName") || "").trim(),
      phone: (fd.get("phone") || "").trim(),
      email: (fd.get("email") || "").trim(),
      address: (fd.get("address") || "").trim(),
      city: (fd.get("city") || "").trim(),
      state: (fd.get("state") || "").trim(),
      zip: (fd.get("zip") || "").trim(),
      website: (fd.get("website") || "").trim(),
      facebook: (fd.get("facebook") || "").trim(),
      instagram: (fd.get("instagram") || "").trim(),
      tiktok: (fd.get("tiktok") || "").trim(),
      category: category,
      products: (fd.get("products") || "").trim(),
      boothLength: (fd.get("boothLength") || "").trim(),
      boothWidth: (fd.get("boothWidth") || "").trim(),
      boothSize: (fd.get("boothLength") || "") + " ft x " + (fd.get("boothWidth") || "") + " ft",
      electricity: fd.get("electricity") || "",
      electricityDetails: (fd.get("electricityDetails") || "").trim(),
      bring: bring.join(", "),
      setupRequests: (fd.get("setupRequests") || "").trim(),
      emergencyName: (fd.get("emergencyName") || "").trim(),
      emergencyRelationship: (fd.get("emergencyRelationship") || "").trim(),
      emergencyPhone: (fd.get("emergencyPhone") || "").trim(),
      agreeGuidelines: !!fd.get("agreeGuidelines"),
      agreeRelease: !!fd.get("agreeRelease"),
      signature: (fd.get("signature") || "").trim(),
      printedName: (fd.get("printedName") || "").trim(),
      signDate: (fd.get("signDate") || "").trim(),
      honeypot: (fd.get("company_url") || "").trim(),
      submittedAt: new Date().toISOString(),
      submittedAtLocal: new Date().toLocaleString(),
      status: "Pending Review"
    };
  }

  /* ---------- Build a fingerprint for duplicate prevention ---------- */
  function fingerprint(d) {
    return [d.businessName, d.email, d.phone].join("|").toLowerCase();
  }
  function alreadySubmitted(fp) {
    try {
      var seen = JSON.parse(sessionStorage.getItem("motown_submitted") || "[]");
      return seen.indexOf(fp) !== -1;
    } catch (e) { return false; }
  }
  function rememberSubmission(fp) {
    try {
      var seen = JSON.parse(sessionStorage.getItem("motown_submitted") || "[]");
      seen.push(fp);
      sessionStorage.setItem("motown_submitted", JSON.stringify(seen));
    } catch (e) { /* no-op */ }
  }

  /* ---------- PDF generation (client-side) ---------- */
  function buildPdf(d) {
    if (!window.jspdf || !window.jspdf.jsPDF) return null;
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "letter" });
    var W = doc.internal.pageSize.getWidth();
    var margin = 48;
    var y = margin;

    // Header band
    doc.setFillColor(89, 20, 32);
    doc.rect(0, 0, W, 92, "F");
    doc.setTextColor(234, 203, 107);
    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.text("THE MOTOWN REVIEW", margin, 42);
    doc.setFontSize(11);
    doc.setTextColor(246, 236, 214);
    doc.setFont("times", "italic");
    doc.text("A Tribute to Berry Gordy  ·  Vendor Application", margin, 62);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Warthen RV Park  ·  Saturday, September 19", margin, 80);
    y = 118;

    function line(label, value) {
      if (value === undefined || value === null || value === "") value = "—";
      doc.setFont("helvetica", "bold");
      doc.setTextColor(120, 90, 45);
      doc.setFontSize(9);
      doc.text(String(label).toUpperCase(), margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 24, 18);
      doc.setFontSize(11);
      var wrapped = doc.splitTextToSize(String(value), W - margin * 2 - 130);
      doc.text(wrapped, margin + 140, y);
      y += Math.max(18, wrapped.length * 14) + 4;
      if (y > doc.internal.pageSize.getHeight() - 70) { doc.addPage(); y = margin; }
    }
    function heading(t) {
      y += 8;
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.8);
      doc.line(margin, y, W - margin, y);
      y += 16;
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.setTextColor(89, 20, 32);
      doc.text(t, margin, y);
      y += 16;
    }

    heading("Business Information");
    line("Business Name", d.businessName);
    line("Owner / Contact", d.contactName);
    line("Phone", d.phone);
    line("Email", d.email);
    var addr = [d.address, [d.city, d.state, d.zip].filter(Boolean).join(", ")].filter(Boolean).join("  ");
    line("Address", addr);
    var social = [
      d.website && ("Web: " + d.website),
      d.facebook && ("FB: " + d.facebook),
      d.instagram && ("IG: " + d.instagram),
      d.tiktok && ("TikTok: " + d.tiktok)
    ].filter(Boolean).join("   ");
    line("Online / Social", social);

    heading("Vendor Details");
    line("Category", d.category);
    line("Products / Services", d.products);

    heading("Booth Information");
    line("Requested Size", d.boothSize);
    line("Electricity", d.electricity + (d.electricityDetails ? (" — " + d.electricityDetails) : ""));
    line("Bringing", d.bring);
    line("Setup Requests", d.setupRequests);

    heading("Emergency Contact");
    line("Name", d.emergencyName);
    line("Relationship", d.emergencyRelationship);
    line("Phone", d.emergencyPhone);

    heading("Agreements & Signature");
    line("Guidelines Agreed", d.agreeGuidelines ? "Yes" : "No");
    line("Liability Release", d.agreeRelease ? "Yes" : "No");
    line("Digital Signature", d.signature);
    line("Printed Name", d.printedName);
    line("Date", d.signDate);

    heading("Submission");
    line("Status", d.status);
    line("Submitted", d.submittedAtLocal);

    return doc;
  }

  /* ---------- mailto fallback ---------- */
  function mailtoFallback(d) {
    var subject = "New Vendor Application – " + (d.businessName || "");
    var body = [
      "NEW VENDOR APPLICATION — THE MOTOWN REVIEW",
      "",
      "Business Name: " + d.businessName,
      "Owner Name: " + d.contactName,
      "Phone: " + d.phone,
      "Email: " + d.email,
      "Vendor Category: " + d.category,
      "Booth Size: " + d.boothSize,
      "Electricity: " + d.electricity + (d.electricityDetails ? (" (" + d.electricityDetails + ")") : ""),
      "",
      "Products / Services:",
      d.products,
      "",
      "Submission Date: " + d.submittedAtLocal,
      "Status: " + d.status,
      "",
      "(A full PDF copy has been downloaded to this device — please attach it to this email.)"
    ].join("\n");
    var href = "mailto:sisterrosellc@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    window.location.href = href;
  }

  /* ---------- Submit handler ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (submitting) return;

    errorSummary.hidden = true;
    errorSummary.textContent = "";

    var result = validate();
    if (!result.ok) {
      errorSummary.hidden = false;
      errorSummary.textContent = "Please correct the highlighted field" +
        (result.problems.length > 1 ? "s" : "") + " (" + result.problems.length + ") before submitting.";
      if (result.firstBad && result.firstBad.focus) {
        result.firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
        try { result.firstBad.focus({ preventScroll: true }); } catch (err) { result.firstBad.focus(); }
      }
      return;
    }

    var data = gather();

    // Duplicate prevention
    var fp = fingerprint(data);
    if (alreadySubmitted(fp)) {
      errorSummary.hidden = false;
      errorSummary.textContent = "It looks like this application was already submitted in this session.";
      return;
    }

    // Silently drop spam bots that filled the hidden honeypot.
    if (data.honeypot) {
      rememberSubmission(fp);
      showConfirmation(data, buildPdf(data), true);
      return;
    }

    submitting = true;
    submitBtn.classList.add("is-loading");
    submitBtn.disabled = true;
    lastPayload = data;

    // Client-side PDF for the vendor's own records (download on confirmation).
    var pdfDoc = buildPdf(data);

    postApplication(data, pdfDoc)
      .then(function () {
        rememberSubmission(fp);
        showConfirmation(data, pdfDoc, true);
      })
      .catch(function () {
        // Every delivery channel failed — never claim success. Tell the vendor,
        // hand them the PDF, and open their mail app addressed to the promoter.
        rememberSubmission(fp);
        showConfirmation(data, pdfDoc, false);
        if (pdfDoc) { try { pdfDoc.save(safeName(data)); } catch (e2) {} }
        mailtoFallback(data);
      })
      .then(function () {
        submitting = false;
        submitBtn.classList.remove("is-loading");
        submitBtn.disabled = false;
      });
  });

  function safeName(d) {
    var base = (d.businessName || "vendor-application").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
    return "Motown-Review-Vendor-" + base + ".pdf";
  }

  // ------------------------------------------------------------------
  //  Delivery
  //  Applications are delivered through two independent channels so a
  //  single outage never loses a vendor:
  //    1. /api/submit  — Resend email + Supabase storage (if configured).
  //    2. FormSubmit   — account-free email relay.
  //  A channel counts as delivered ONLY when it confirms delivery in its
  //  response body. FormSubmit answers 200 with {"success":"false"} when
  //  the recipient address has never been activated, when the form has
  //  been disabled, or when it is rate-limiting — so checking the HTTP
  //  status alone silently drops applications.
  // ------------------------------------------------------------------
  var FORMSUBMIT_ENDPOINT = "https://formsubmit.co/ajax/sisterrosellc@gmail.com";
  var API_ENDPOINT = "/api/submit";

  function isTruthyFlag(v) {
    return v === true || String(v).toLowerCase() === "true";
  }

  // jsPDF -> bare base64 (no data: prefix) for the server-side attachment.
  function pdfToBase64(pdfDoc) {
    if (!pdfDoc) return null;
    try {
      var uri = pdfDoc.output("datauristring");
      var comma = uri.indexOf(",");
      return comma === -1 ? null : uri.slice(comma + 1);
    } catch (e) {
      return null;
    }
  }

  function postToApi(data, pdfDoc) {
    return fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ application: data, pdfBase64: pdfToBase64(pdfDoc) })
    }).then(function (r) {
      if (!r.ok) throw new Error("api status " + r.status);
      return r.json();
    }).then(function (json) {
      // The function answers 200 with emailed:false when no mail provider is
      // configured — that is not a delivery, so fall through to FormSubmit.
      if (!json || json.emailed !== true) throw new Error("api did not email");
      return json;
    });
  }

  function postToFormSubmit(data) {
    var payload = {
      _subject: "New Vendor Application \u2013 " + (data.businessName || ""),
      _template: "table",
      _captcha: "false",
      _cc: "the5loavesagency@gmail.com",
      _autoresponse:
        "Thank you for applying to be a vendor at The Motown Review: A Tribute to Berry Gordy, " +
        "featuring The Band of the South (Saturday, September 19 at Warthen RV Park). " +
        "We have received your application and our team will review it and contact you regarding your acceptance. " +
        "The $75 vendor fee is payable by Cash App to $warthenrvpark once approved — please include your business name in the payment notes. " +
        "Questions? Call 478-201-7610. Follow us @warthenrvpark. — Warthen RV Park",
      name: data.contactName,
      email: data.email,
      "Business Name": data.businessName,
      "Owner / Contact Name": data.contactName,
      "Phone": data.phone,
      "Email": data.email,
      "Business Address": [data.address, data.city, data.state, data.zip].filter(Boolean).join(", "),
      "Website": data.website,
      "Facebook": data.facebook,
      "Instagram": data.instagram,
      "TikTok": data.tiktok,
      "Vendor Category": data.category,
      "Products / Services": data.products,
      "Booth Size": data.boothSize,
      "Electricity": data.electricity + (data.electricityDetails ? " - " + data.electricityDetails : ""),
      "Bringing": data.bring,
      "Additional Setup Requests": data.setupRequests,
      "Emergency Contact": [data.emergencyName, data.emergencyRelationship, data.emergencyPhone].filter(Boolean).join(" | "),
      "Agreed to Guidelines": data.agreeGuidelines ? "Yes" : "No",
      "Agreed to Liability Release": data.agreeRelease ? "Yes" : "No",
      "Digital Signature": data.signature,
      "Printed Name": data.printedName,
      "Signed Date": data.signDate,
      "Status": data.status,
      "Submitted": data.submittedAtLocal
    };
    // Drop empty optional values so the email stays tidy.
    Object.keys(payload).forEach(function (k) {
      if (payload[k] === "" || payload[k] == null) delete payload[k];
    });

    return fetch(FORMSUBMIT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error("formsubmit status " + r.status);
      return r.json().catch(function () { return null; });
    }).then(function (json) {
      // No parsable body — FormSubmit accepted it but told us nothing; treat
      // that as a failure rather than assuming the promoter was emailed.
      if (!json) throw new Error("formsubmit returned no body");
      if (!isTruthyFlag(json.success)) {
        throw new Error("formsubmit rejected: " + (json.message || "unknown reason"));
      }
      return json;
    });
  }

  // Resolves when a channel confirms delivery; rejects when every channel fails.
  function postApplication(data, pdfDoc) {
    return postToApi(data, pdfDoc).catch(function (apiErr) {
      console.warn("Primary delivery (/api/submit) failed:", apiErr.message);
      return postToFormSubmit(data).catch(function (fsErr) {
        console.error("Fallback delivery (FormSubmit) failed:", fsErr.message);
        throw fsErr;
      });
    });
  }

  /* ---------- Confirmation ---------- */
  function showConfirmation(data, pdfDoc, delivered) {
    // When nothing got through, replace the success wording with instructions
    // instead of telling the vendor their application was received.
    var warning = document.getElementById("confirmWarning");
    var lead = document.querySelector("#confirmScreen .confirm-lead");
    if (delivered === false) {
      if (warning) warning.hidden = false;
      if (lead) lead.textContent = "We could not send your application automatically — please follow the steps below so it reaches us.";
    } else {
      if (warning) warning.hidden = true;
      if (lead) lead.textContent = "Your vendor application has been successfully submitted.";
    }

    var dl = document.getElementById("confirmDownload");
    var dlBtn = document.getElementById("downloadPdfBtn");
    if (pdfDoc && dl && dlBtn) {
      dl.hidden = false;
      dlBtn.addEventListener("click", function (e) {
        e.preventDefault();
        try { pdfDoc.save(safeName(data)); } catch (err) {}
      });
    }
    // Pre-fill the payment-confirmation form with the applicant's business name.
    var proofBusiness = document.getElementById("proofBusiness");
    var proofSubject = document.getElementById("proofSubject");
    if (proofBusiness) proofBusiness.value = data.businessName || "";
    if (proofSubject) proofSubject.value = "Vendor Payment Confirmation – " + (data.businessName || "");

    confirmScreen.hidden = false;
    document.body.style.overflow = "hidden";
    confirmScreen.scrollTop = 0;
    var returnBtn = document.getElementById("returnBtn");
    if (returnBtn) { try { returnBtn.focus(); } catch (e) {} }
  }

  function hideConfirmation() {
    confirmScreen.hidden = true;
    document.body.style.overflow = "";
    form.reset();
    // Reset conditional fields
    toggle(otherWrap, false);
    toggle(elecWrap, false);
    if (signDate) signDate.value = new Date().toISOString().slice(0, 10);
    errorSummary.hidden = true;
  }

})();
