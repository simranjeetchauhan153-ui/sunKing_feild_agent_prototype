const view = document.querySelector("#view");
const breadcrumb = document.querySelector("#breadcrumb-current");
const toastRegion = document.querySelector("#toast-region");

const customers = [
  { initials: "AN", name: "Amina Njoroge", phone: "+254 712 345 678", location: "Kibera, Nairobi", status: "Completed", date: "Today, 10:42 AM" },
  { initials: "DO", name: "Daniel Otieno", phone: "+254 723 901 456", location: "Lang'ata, Nairobi", status: "In progress", date: "Today, 9:18 AM" },
  { initials: "GW", name: "Grace Wambui", phone: "+254 701 228 903", location: "Westlands, Nairobi", status: "Completed", date: "Yesterday" },
];

const demoCustomer = {
  name: "Faith Wanjiku",
  country: "Kenya",
  state: "Nairobi County",
  idType: "National ID",
  idNumber: "28476193",
  phone: "+254 711 482 906",
  contact: "WhatsApp preferred",
  note: "Interested in a solar home system. Best time to call: after 5 PM.",
};

let screen = "home";
let flowStep = 1;
let firstAttempts = 0;
let firstAnalyzed = false;
let firstFile = "";
let secondFile = "";
let customerForm = { ...demoCustomer };
let completedCustomer = null;
let intentScore = 92;
let errorMessage = "";

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function renderHome() {
  screen = "home";
  breadcrumb.textContent = "Overview";
  document.querySelectorAll(".phone-nav-item").forEach((item) => item.classList.toggle("active", item.dataset.nav === "home"));
  const rows = customers.map((customer, index) => `
    <button class="activity-row" data-entry-index="${index}" aria-label="Open ${escapeHtml(customer.name)} customer form">
      <div class="customer-avatar">${customer.initials}</div>
      <div><div class="customer-name">${customer.name}</div><div class="customer-phone">${customer.phone}</div></div>
      <div class="activity-meta">${customer.location}</div>
      <span class="status-pill ${customer.status === "In progress" ? "pending" : ""}">${customer.status}</span>
      <span class="row-arrow">›</span>
    </button>
  `).join("");
  view.innerHTML = `
    <div class="page-heading">
      <div><div class="eyebrow">FRIDAY · OCT 9</div><h1>Good morning, Joseph <span aria-hidden="true">☀️</span></h1><p class="subtitle">Ready to bring clean energy to more homes today?</p></div>
      <button class="primary-button" data-action="start"><span>＋</span> New entry</button>
    </div>
    <div class="welcome-grid">
      <section class="hero-card">
        <div class="sun-mark" aria-hidden="true">☼</div>
        <div class="hero-copy"><div class="eyebrow">YOUR NEXT CUSTOMER STARTS HERE</div><h2>A brighter day begins with a conversation.</h2><p>Capture their story, understand what they need, and find the right solar solution together.</p><button class="primary-button" data-action="start">Start a new entry <span class="button-arrow">→</span></button></div>
      </section>
      <section class="stat-card">
        <div class="stat-top"><span>Your October impact</span><span class="stat-icon">☀</span></div>
        <div><div class="stat-number">24</div><div class="stat-caption">customer conversations captured</div></div>
        <div class="stat-progress"><div class="progress-track"><span></span></div><span>24 of 38 monthly goal</span></div>
      </section>
    </div>
    <div class="section-heading"><h2>Recent customer entries</h2><span>Last 7 days</span></div>
    <section class="activity-card">${rows}</section>
    <div class="demo-note"><span>✦</span><div><strong>Prototype mode</strong> &nbsp;Tap an entry to review its customer form, or use a sample video to try the flow.</div></div>
  `;
}

function stepperMarkup(active) {
  const steps = [
    ["1", "Intro video"],
    ["2", "Review details"],
    ["3", "Customer video"],
    ["4", "Complete"],
  ];
  return `<div class="stepper">${steps.map(([number, label], index) => {
    const current = index + 1;
    return `<div class="step ${current === active ? "active" : ""} ${current < active ? "done" : ""}"><span class="step-number">${current < active ? "✓" : number}</span><span class="step-label">${label}</span></div>`;
  }).join("")}</div>`;
}

function uploadPanel(stage) {
  const isFirst = stage === 1;
  const file = isFirst ? firstFile : secondFile;
  const analyzed = isFirst && firstAnalyzed;
  const title = isFirst ? "1. Informal introduction" : "2. Customer conversation";
  const detail = isFirst
    ? "Ask the customer to introduce themselves. We’ll listen for their name, location and contact details."
    : "Record your conversation about their energy needs. We’ll highlight their interest and next steps.";
  const accept = "video/mp4,video/quicktime,video/webm,video/*";
  return `
    <section class="panel panel-pad">
      <div class="panel-title"><div><h2>${title}</h2><p>${detail}</p></div><span class="optional-label">VIDEO · UP TO 2 MIN</span></div>
      <div class="upload-box" data-dropzone="${stage}">
        <span class="upload-icon" aria-hidden="true">${isFirst ? "↥" : "◉"}</span>
        <strong>${file ? "Video ready to review" : "Add a video recording"}</strong>
        <p>${file ? "Choose analyze to process this recording." : "Drag and drop here, or choose a file from your device."}</p>
        <div class="upload-actions">
          <label class="small-button" for="video-${stage}">Choose video</label>
          <input class="file-input" id="video-${stage}" type="file" accept="${accept}" data-file-stage="${stage}" />
          <button class="small-button" data-action="sample" data-stage="${stage}">Use sample video</button>
        </div>
        <div class="file-name ${file ? "visible" : ""}"><span>▶</span><span>${escapeHtml(file)}</span></div>
      </div>
      <div class="error-card ${errorMessage && !analyzed ? "visible" : ""}" role="alert">
        <span class="error-symbol">!</span><div><strong>${escapeHtml(errorMessage)}</strong><p>${isFirst ? "Check your connection and try the sample recording again. Your customer details are safe." : "The video is still saved. Try analyzing it again when you’re ready."}</p></div>
      </div>
      ${file ? `<div class="review-foot"><button class="text-button" data-action="back-home">Cancel entry</button><button class="primary-button" data-action="analyze" data-stage="${stage}">${isFirst ? (analyzed ? "Analyzed ✓" : "Analyze video") : "Submit video"} <span class="button-arrow">→</span></button></div>` : ""}
    </section>
  `;
}

function detailForm() {
  const fields = [
    ["name", "Full name", "text", true],
    ["country", "Country", "select", true],
    ["state", "State / county", "text", true],
    ["idType", "ID type", "select", true],
    ["idNumber", "ID number", "text", true],
    ["phone", "Phone number", "tel", true],
    ["contact", "Preferred contact", "text", false],
    ["note", "Agent note", "textarea", false],
  ];
  return fields.map(([key, label, type, required]) => {
    const value = escapeHtml(customerForm[key] || "");
    let input;
    if (key === "country") {
      input = `<select name="${key}" ${required ? "required" : ""}><option value="">Select country</option><option ${customerForm.country === "Kenya" ? "selected" : ""}>Kenya</option><option ${customerForm.country === "Uganda" ? "selected" : ""}>Uganda</option><option ${customerForm.country === "Nigeria" ? "selected" : ""}>Nigeria</option><option ${customerForm.country === "Tanzania" ? "selected" : ""}>Tanzania</option></select>`;
    } else if (key === "idType") {
      input = `<select name="${key}" ${required ? "required" : ""}><option value="">Select ID type</option><option ${customerForm.idType === "National ID" ? "selected" : ""}>National ID</option><option ${customerForm.idType === "Passport" ? "selected" : ""}>Passport</option><option ${customerForm.idType === "Voter ID" ? "selected" : ""}>Voter ID</option></select>`;
    } else if (type === "textarea") {
      input = `<textarea name="${key}">${value}</textarea>`;
    } else {
      input = `<input name="${key}" type="${type}" value="${value}" ${required ? "required" : ""} ${key === "phone" ? 'inputmode="tel"' : ""} />`;
    }
    return `<div class="field ${key === "note" ? "full" : ""}"><label for="field-${key}">${label}${required ? ' <em>*</em>' : ""}</label>${input}</div>`;
  }).join("");
}

function checklistMarkup() {
  return `
    <section class="panel side-info">
      <h3>Entry checklist</h3>
      <div class="checklist">
        <div class="check-row"><span class="check-mark ${firstAnalyzed ? "complete" : ""}">${firstAnalyzed ? "✓" : "1"}</span><div><strong>Introduction video</strong><small>${firstAnalyzed ? "Analyzed successfully" : "Capture name and contact details"}</small></div></div>
        <div class="check-row"><span class="check-mark">2</span><div><strong>Review customer details</strong><small>Confirm everything is correct before saving</small></div></div>
        <div class="check-row"><span class="check-mark">3</span><div><strong>Conversation video</strong><small>Understand the customer’s energy needs</small></div></div>
      </div>
      <div class="side-tip"><strong>☼ &nbsp;A quick tip</strong>Keep the customer’s face in view and find a quiet spot before recording.</div>
    </section>
  `;
}

function renderFirstStep() {
  screen = "flow";
  flowStep = 1;
  breadcrumb.textContent = "New customer entry";
  view.innerHTML = `
    <div class="flow-head"><div><div class="eyebrow">NEW CUSTOMER · STEP 1 OF 4</div><h1>Record an introduction</h1><p class="subtitle">Ask the customer to share their name, location and contact details.</p></div><div class="flow-ref">SK-2026-1048</div></div>
    ${stepperMarkup(1)}
    <div class="flow-layout">
      <div>
        ${uploadPanel(1)}
      </div>
      <div><section class="panel side-info"><h3>Step 1 of 4</h3><div class="side-tip"><strong>☼ &nbsp;Introduction video</strong>Ask the customer to clearly say their name, country, ID details and phone number. Their answers pre-fill the next step.</div></section></div>
    </div>
  `;
}

function renderDetailsStep() {
  screen = "flow";
  flowStep = 2;
  breadcrumb.textContent = "Review customer details";
  view.innerHTML = `
    <div class="flow-head"><div><div class="eyebrow">NEW CUSTOMER · STEP 2 OF 4</div><h1>Review customer details</h1><p class="subtitle">We’ve picked up these details from the introduction. Review and confirm them with your customer.</p></div><div class="flow-ref">SK-2026-1048</div></div>
    ${stepperMarkup(2)}
    <section class="panel panel-pad">
      <div class="panel-title"><div><h2>Customer information</h2><p>Fields can be corrected before continuing.</p></div></div>
      <div class="prefill-banner"><span>✓</span><strong>Pre-filled from ${firstAnalyzed ? "the introduction video" : "customer record"}</strong></div>
      <form id="customer-form" novalidate><div class="field-grid">${detailForm()}</div>
        <div class="review-foot"><button type="button" class="secondary-button" data-action="previous">← &nbsp;Back</button><button type="submit" class="primary-button">Confirm &amp; continue <span class="button-arrow">→</span></button></div>
      </form>
    </section>
  `;
}

function renderSecondStep() {
  screen = "flow";
  flowStep = 3;
  breadcrumb.textContent = "Customer conversation";
  view.innerHTML = `
    <div class="flow-head"><div><div class="eyebrow">NEW CUSTOMER · STEP 3 OF 4</div><h1>Record the conversation</h1><p class="subtitle">Talk with ${escapeHtml(customerForm.name || "your customer")} about their energy needs. We’ll return an intent score and summary.</p></div><div class="flow-ref">SK-2026-1048</div></div>
    ${stepperMarkup(3)}
    <div class="flow-layout">
      <div>
        ${uploadPanel(2)}
        <div class="review-foot" style="margin-top:12px"><button class="secondary-button" data-action="previous">← &nbsp;Back to details</button></div>
      </div>
      <div>
        <section class="panel side-info"><h3>Customer details</h3><div class="checklist">
          <div class="check-row"><span class="check-mark complete">✓</span><div><strong>${escapeHtml(customerForm.name || "Customer")}</strong><small>${escapeHtml(customerForm.phone || "No phone added")}</small></div></div>
          <div class="check-row"><span class="check-mark complete">✓</span><div><strong>Introduction video</strong><small>Details reviewed and saved</small></div></div>
        </div><div class="side-tip"><strong>☼ &nbsp;A quick tip</strong>Let the customer speak in their own words. A natural conversation gives the best insight.</div></section>
      </div>
    </div>
  `;
}

function renderSuccess() {
  screen = "success";
  breadcrumb.textContent = "Entry complete";
  const person = completedCustomer || customerForm;
  view.innerHTML = `
    <div class="flow-head"><div><div class="eyebrow">NEW CUSTOMER · COMPLETE</div><h1>Customer entry</h1></div><div class="flow-ref">ENTRY ID &nbsp;<strong>SK-2026-1048</strong></div></div>
    ${stepperMarkup(4)}
    <div class="success-wrap">
      <div class="success-icon">✓</div>
      <div class="eyebrow">ALL DONE</div>
      <h1>Great work, Joseph!</h1>
      <p class="subtitle">Your form for this customer has been completed. Their details and conversation are safely recorded.</p>
      <div class="success-score"><span class="success-score-label">CUSTOMER INTENT SCORE</span><strong>${intentScore}<small>/100</small></strong><span class="score-rating">High purchase intent</span></div>
      <div class="success-summary">
        <div class="summary-item"><small>Customer</small><strong>${escapeHtml(person.name || "Customer")}</strong></div>
        <div class="summary-item"><small>Phone number</small><strong>${escapeHtml(person.phone || "Not provided")}</strong></div>
        <div class="summary-item"><small>Customer intent</small><strong>Interested in solar home system</strong></div>
        <div class="summary-item"><small>Follow-up</small><strong>After 5:00 PM</strong></div>
      </div>
      <div class="success-actions"><button class="secondary-button" data-action="home">Back to overview</button><button class="primary-button" data-action="start">＋ &nbsp;Add another customer</button></div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function resetFlow() {
  flowStep = 1;
  firstAttempts = 0;
  firstAnalyzed = false;
  firstFile = "";
  secondFile = "";
  customerForm = { ...demoCustomer };
  completedCustomer = null;
  intentScore = 92;
  errorMessage = "";
}

function showToast(message) {
  toastRegion.innerHTML = `<div class="toast">${escapeHtml(message)}</div>`;
  window.setTimeout(() => { toastRegion.innerHTML = ""; }, 2800);
}

function prefillForm() {
  if (!firstAnalyzed) customerForm = { ...demoCustomer };
  firstAnalyzed = true;
  errorMessage = "";
  renderDetailsStep();
  showToast("Introduction analyzed — details are ready to review.");
}

function analyzeVideo(stage) {
  if (stage === 1) {
    firstAttempts += 1;
    if (firstAttempts === 2) {
      errorMessage = "We couldn’t analyze this video just yet.";
      firstAnalyzed = false;
      renderFirstStep();
      return;
    }
    prefillForm();
    return;
  }
  errorMessage = "";
  completeEntry();
}

function completeEntry() {
  completedCustomer = { ...customerForm };
  customers.unshift({ initials: initials(completedCustomer.name), name: completedCustomer.name, phone: completedCustomer.phone, location: completedCustomer.state, status: "Completed", date: "Just now" });
  renderSuccess();
}

function setFile(stage, file) {
  if (!file) return;
  const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|webm|m4v|3gp)$/i.test(file.name);
  if (!isVideo) {
    errorMessage = "Please choose a video file (MP4, MOV or WEBM).";
    if (stage === 1) renderFirstStep();
    else renderSecondStep();
    return;
  }
  errorMessage = "";
  if (stage === 1) {
    firstFile = file.name;
    renderFirstStep();
  } else {
    secondFile = file.name;
    renderSecondStep();
  }
}

function updateFormFromDOM() {
  const form = document.querySelector("#customer-form");
  if (!form) return true;
  const values = Object.fromEntries(new FormData(form).entries());
  customerForm = { ...customerForm, ...values };
  let valid = true;
  form.querySelectorAll("[required]").forEach((field) => {
    const previousError = field.parentElement.querySelector(".field-error");
    if (previousError) previousError.remove();
    if (!field.value.trim()) {
      valid = false;
      const error = document.createElement("div");
      error.className = "field-error";
      error.textContent = "Please complete this field.";
      field.parentElement.append(error);
    }
  });
  return valid;
}

view.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action], [data-entry-index]");
  if (!button) return;
  const action = button.dataset.action;
  const stage = Number(button.dataset.stage);
  if (action === "start") { resetFlow(); renderFirstStep(); }
  if (action === "back-home" || action === "home") renderHome();
  if (action === "sample") {
    if (stage === 1) { firstFile = "sun-king-introduction-sample.mp4"; errorMessage = ""; renderFirstStep(); }
    else { secondFile = "sun-king-customer-conversation-sample.mp4"; errorMessage = ""; renderSecondStep(); }
  }
  if (action === "analyze") analyzeVideo(stage);
  if (action === "previous") {
    if (flowStep === 3) renderDetailsStep();
    else renderFirstStep();
  }
  if (action === "help") showToast("Your team lead can help with this entry.");
  if (button.dataset.entryIndex !== undefined) {
    const customer = customers[Number(button.dataset.entryIndex)];
    if (customer) {
      resetFlow();
      customerForm = { ...demoCustomer, name: customer.name, phone: customer.phone, state: customer.location };
      firstAnalyzed = true;
      renderDetailsStep();
    }
  }
});

view.addEventListener("change", (event) => {
  if (event.target.matches("[data-file-stage]")) {
    setFile(Number(event.target.dataset.fileStage), event.target.files[0]);
  }
});

view.addEventListener("submit", (event) => {
  if (event.target.id !== "customer-form") return;
  event.preventDefault();
  if (!updateFormFromDOM()) {
    showToast("Please complete the required customer details.");
    return;
  }
  errorMessage = "";
  renderSecondStep();
});

view.addEventListener("input", (event) => {
  const field = event.target;
  if (!field.name || !document.querySelector("#customer-form")) return;
  customerForm[field.name] = field.value;
  const fieldError = field.parentElement.querySelector(".field-error");
  if (fieldError && field.value.trim()) fieldError.remove();
});

view.addEventListener("dragover", (event) => {
  const zone = event.target.closest("[data-dropzone]");
  if (zone) { event.preventDefault(); zone.classList.add("dragover"); }
});
view.addEventListener("dragleave", (event) => {
  const zone = event.target.closest("[data-dropzone]");
  if (zone) zone.classList.remove("dragover");
});
view.addEventListener("drop", (event) => {
  const zone = event.target.closest("[data-dropzone]");
  if (!zone) return;
  event.preventDefault();
  zone.classList.remove("dragover");
  setFile(Number(zone.dataset.dropzone), event.dataTransfer.files[0]);
});

document.querySelectorAll(".phone-nav-item").forEach((item) => item.addEventListener("click", () => {
  document.querySelectorAll(".phone-nav-item").forEach((nav) => nav.classList.toggle("active", nav === item));
  if (item.dataset.nav === "home") renderHome();
  else {
    if (item.dataset.nav === "customers") {
      renderHome();
      document.querySelector(".section-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else showToast("Your team lead can help with this entry.");
  }
}));

document.querySelector(".phone-header").addEventListener("click", (event) => {
  const button = event.target.closest('[data-action="home"]');
  if (button && screen !== "home") renderHome();
});

renderHome();
