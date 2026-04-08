const state = {
  dashboard: null,
  token: localStorage.getItem("sample_tracking_token") || "",
  user: null,
  role: null,
  selectedLotId: null,
  selectedInventoryLotId: null,
  selectedDispatchId: null,
  pendingScrollTo: "",
};

const $ = (selector) => document.querySelector(selector);

const API_BASE_URL = String(window.API_BASE_URL || "").trim().replace(/\/+$/, "");

function resolveApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith("/")) path = `/${path}`;
  if (API_BASE_URL) return `${API_BASE_URL}${path}`;
  return path;
}

function isSmallScreen() {
  return window.matchMedia("(max-width: 520px)").matches;
}

function isGitHubPages() {
  return /github\.io$/i.test(location.hostname);
}

function appHomeUrl() {
  return new URL("./", location.href).toString();
}

function loginUrl() {
  return new URL("login.html", appHomeUrl()).toString();
}

async function api(path, options = {}) {
  const url = resolveApiUrl(path);
  const method = (options.method || "GET").toUpperCase();
  let response;
  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(state.token ? { "X-Auth-Token": state.token } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (error) {
    const base = API_BASE_URL || "(same origin)";
    const hint = API_BASE_URL
      ? " (Check backend URL/CORS: set `CORS_ALLOW_ORIGINS=*` or include this site origin.)"
      : " (Backend not reachable: start it with `python3 server.py` — `python3 -m http.server` won’t handle /api/*.)";
    throw new Error(`Network error: ${error?.message || String(error)} (${method} ${url}, API_BASE_URL=${base})${hint}`);
  }
  if (!response.ok) {
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    const payload = contentType.includes("application/json") ? await response.json().catch(() => null) : null;
    const fallbackText = payload ? "" : await response.text().catch(() => "");
    const details = (payload && (payload.error || payload.message)) || fallbackText.replace(/\s+/g, " ").trim().slice(0, 160);
    const isMutation = method === "PATCH" || method === "DELETE";
    const needsPersistentBackendHint = response.status === 404 && API_BASE_URL && isMutation && /railway\.app$/i.test(API_BASE_URL);
    const hint = response.status === 404 && String(path).startsWith("/api/") && !API_BASE_URL
      ? " (Hint: start the backend with `python3 server.py` — `python3 -m http.server` won’t serve /api/*.)"
      : needsPersistentBackendHint
        ? " (Hint: your backend returned 404 for update/delete. If running on Railway with SQLite, use 1 replica + a persistent volume + `SAMPLE_TRACKING_DB_PATH=/var/data/sample_tracking.db`, then redeploy.)"
      : "";
    const message = `${details || `Request failed: ${response.status}`} (${method} ${response.url})${hint}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
}

function statusBadge(value) {
  const v = String(value || "").toLowerCase();
  const tone = v.includes("deliver") || v.includes("approved") || v === "true" || v.includes("submitted")
    ? "good"
    : v.includes("draft") || v.includes("review") || v.includes("transit") || v.includes("pending")
      ? "warn"
      : "bad";
  return `<span class="badge ${tone}">${value}</span>`;
}

function hasAccess(zone) {
  return Boolean(state.dashboard?.access?.[zone]);
}

function showLogin(message = "") {
  // Login is a separate page now.
  if (!location.pathname.endsWith("/login.html")) {
    location.replace(loginUrl());
    return;
  }
  const err = $("#login-error");
  if (err) err.textContent = message;
}

function reportClientError(error) {
  const msg = (error && (error.message || String(error))) || "Unknown client error";
  const el = document.getElementById("login-error");
  if (el) el.textContent = msg;
}

window.addEventListener("error", (event) => {
  reportClientError(event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  reportClientError(event.reason);
});

function showAppShell() {
  // App shell is `/` now.
  if (location.pathname.endsWith("/login.html")) {
    location.replace(appHomeUrl());
    return;
  }
}

function renderSessionBadge() {
  const badge = $("#session-badge");
  if (!badge) return;
  badge.textContent = `${state.user?.name || ""} · ${(state.role || "").toUpperCase()}`;
}

function renderTable(container, columns, rows, options = {}) {
  if (!rows.length) {
    container.innerHTML = `<div class="table-wrap"><div class="empty-state">${options.empty || "No rows found."}</div></div>`;
    return;
  }

  if (isSmallScreen() && options.layout !== "table") {
    const selectedId = options.selectedId;
    const selectable = Boolean(options.onSelect);
    const cards = rows.map((row) => {
      const rowId = row.id ?? row.dispatch_id;
      const selected = selectedId && rowId === selectedId ? "selected" : "";
      const cardTag = selectable ? "button" : "div";
      const attributes = selectable
        ? `type="button" class="row-card ${selected}" data-row-id="${rowId}"`
        : `class="row-card ${selected}"`;

      const fields = columns.map((column) => {
        const value = typeof column.render === "function" ? column.render(row) : row[column.key] ?? "";
        if (value === "" || value == null) return "";
        return `<div class="kv"><div class="k">${column.label}</div><div class="v">${value}</div></div>`;
      }).filter(Boolean).join("");

      return `
        <${cardTag} ${attributes}>
          <div class="row-grid">${fields}</div>
        </${cardTag}>
      `;
    }).join("");

    container.innerHTML = `<div class="row-cards">${cards}</div>`;

    if (options.onSelect) {
      container.querySelectorAll("[data-row-id]").forEach((rowEl) => {
        rowEl.addEventListener("click", () => options.onSelect(Number(rowEl.dataset.rowId)));
      });
    }
    return;
  }

  const selectedId = options.selectedId;
  const body = rows.map((row) => {
    const cells = columns.map((column) => {
      const value = typeof column.render === "function" ? column.render(row) : row[column.key] ?? "";
      return `<td>${value}</td>`;
    }).join("");
    const rowId = row.id ?? row.dispatch_id;
    const selected = selectedId && rowId === selectedId ? "selected" : "";
    return `<tr class="${selected}" data-row-id="${rowId}">${cells}</tr>`;
  }).join("");

  const wrapClass = options.onSelect ? "table-wrap table-selectable" : "table-wrap";
  container.innerHTML = `
    <div class="${wrapClass}">
      <table>
        <thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;

  if (options.onSelect) {
    container.querySelectorAll("tbody tr").forEach((rowEl) => {
      rowEl.addEventListener("click", () => options.onSelect(Number(rowEl.dataset.rowId)));
    });
  }
}

function bindModalButtons() {
  document.querySelectorAll("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      $(`#${button.dataset.openModal}`).showModal();
    });
  });
  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });
}

function populateMetrics(metrics) {
  const cards = [
    metrics.totalLots != null ? `<div class="metric"><strong>${metrics.totalLots}</strong><span>Total lots</span></div>` : "",
    metrics.openLots != null ? `<div class="metric"><strong>${metrics.openLots}</strong><span>Open inventory lots</span></div>` : "",
    metrics.deliveredShipments != null ? `<div class="metric"><strong>${metrics.deliveredShipments}</strong><span>Delivered shipments</span></div>` : "",
    metrics.feedbackPending != null ? `<div class="metric"><strong>${metrics.feedbackPending}</strong><span>Feedback pending</span></div>` : "",
  ].filter(Boolean).join("");
  $("#metrics").innerHTML = `<div class="metric-grid">${cards}</div>`;
}

function applyAccessUI() {
  const access = state.dashboard.access;
  $("#panel-quality").hidden = !access.quality;
  $("#panel-logistics").hidden = !access.logistics;
  $("#panel-marketing").hidden = !access.marketing;
  $("#access-banner").textContent = `${state.user.name} signed in with ${state.role} access`;
  $("#access-banner").className = `access-banner role-${state.role}`;
  $("#analysis-trigger").disabled = !hasAccess("quality") || !state.selectedLotId;
  $("#dispatch-trigger").disabled = !hasAccess("logistics") || !state.selectedInventoryLotId;
  $("#feedback-trigger").disabled = !hasAccess("marketing") || !state.selectedDispatchId;
}

async function loadDashboard() {
  state.dashboard = await api("/api/dashboard");
  state.user = state.dashboard.user;
  state.role = state.dashboard.role;
  renderSessionBadge();
  showAppShell();
  applyAccessUI();
  populateMetrics(state.dashboard.metrics);

  if (hasAccess("quality")) {
    renderTable($("#lots-table"), [
      { label: "Lot", key: "lot_number" },
      { label: "Product", key: "product_name" },
      { label: "Qty", render: (r) => `${r.initial_quantity} ${r.unit_measure}` },
      { label: "Status", render: (r) => statusBadge(r.status) },
      { label: "Analyses", key: "analysis_count" },
      { label: "Actions", render: (r) => `
        <div class="table-actions">
          <button class='edit-lot-btn' data-id='${r.id}'>Edit</button>
          <button class='delete-lot-btn' data-id='${r.id}'>Delete</button>
        </div>
      ` },
    ], state.dashboard.lots, {
      selectedId: state.selectedLotId,
      onSelect: selectLot,
    });
    // Bind delete buttons for lots
    document.querySelectorAll('.delete-lot-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Delete this lot?')) {
          await api(`/api/lots/${btn.dataset.id}`, { method: 'DELETE' });
          await loadDashboard();
        }
      });
    });
    // Bind edit buttons for lots (edit modal)
    document.querySelectorAll('.edit-lot-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lotId = btn.dataset.id;
        const lot = state.dashboard.lots.find(l => l.id == lotId);
        if (!lot) return;
        const lotForm = document.getElementById('lot-form');
        lotForm.reset();
        lotForm.setAttribute('data-edit-id', lotId);
        lotForm.querySelector('input[name="lot_number"]').value = lot.lot_number;
        lotForm.querySelector('input[name="product_name"]').value = lot.product_name;
        lotForm.querySelector('input[name="initial_quantity"]').value = lot.initial_quantity;
        lotForm.querySelector('select[name="unit_measure"]').value = lot.unit_measure;
        lotForm.querySelector('input[name="project_ref"]').value = lot.project_ref || '';
        lotForm.querySelector('select[name="status"]').value = lot.status;
        lotForm.querySelector('textarea[name="notes"]').value = lot.notes || '';
        // Change modal title
        lotForm.querySelector('.panel-label').textContent = 'Edit lot';
        lotForm.querySelector('h3').textContent = 'Edit sample lot';
        // Change button text
        lotForm.querySelector('button[type="submit"]').textContent = 'Save Changes';
        // Add Cancel button if not present
        if (!lotForm.querySelector('.cancel-edit-btn')) {
          const cancelBtn = document.createElement('button');
          cancelBtn.type = 'button';
          cancelBtn.className = 'ghost cancel-edit-btn';
          cancelBtn.textContent = 'Cancel';
          cancelBtn.style.marginLeft = '10px';
          cancelBtn.onclick = function() {
            lotForm.reset();
            lotForm.removeAttribute('data-edit-id');
            lotForm.querySelector('.panel-label').textContent = 'New lot';
            lotForm.querySelector('h3').textContent = 'Create a sample lot';
            lotForm.querySelector('button[type="submit"]').textContent = 'Save Lot';
            this.remove();
            document.getElementById('lot-modal').close();
          };
          lotForm.querySelector('.modal-head').appendChild(cancelBtn);
        }
        document.getElementById('lot-modal').showModal();
      });
    });
  } else {
    state.selectedLotId = null;
  }

  if (hasAccess("logistics")) {
    renderTable($("#inventory-table"), [
      { label: "Lot", key: "lot_number" },
      { label: "Product", key: "product_name" },
      { label: "Status", render: (r) => statusBadge(r.status) },
      { label: "Project", key: "project_ref" },
      { label: "Created", render: (r) => new Date(r.created_at).toLocaleDateString() },
      { label: "Actions", render: (r) => `
        <div class="table-actions">
          <button class='edit-inventory-btn' data-id='${r.id}'>Edit</button>
          <button class='delete-inventory-btn' data-id='${r.id}'>Delete</button>
        </div>
      ` },
    ], state.dashboard.inventory, {
      selectedId: state.selectedInventoryLotId,
      onSelect: selectInventoryLot,
    });
    // Bind delete buttons for inventory lots
    document.querySelectorAll('.delete-inventory-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Delete this inventory lot?')) {
          await api(`/api/lots/${btn.dataset.id}`, { method: 'DELETE' });
          await loadDashboard();
        }
      });
    });
    // Bind edit buttons for inventory lots (edit uses the same lot modal + /api/lots/<id> PATCH)
    document.querySelectorAll('.edit-inventory-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lotId = btn.dataset.id;
        const lot = state.dashboard.inventory.find(l => String(l.id) === String(lotId));
        if (!lot) return;
        const lotForm = document.getElementById('lot-form');
        lotForm.reset();
        lotForm.setAttribute('data-edit-id', lotId);
        lotForm.querySelector('input[name="lot_number"]').value = lot.lot_number;
        lotForm.querySelector('input[name="product_name"]').value = lot.product_name;
        lotForm.querySelector('input[name="initial_quantity"]').value = lot.initial_quantity;
        lotForm.querySelector('select[name="unit_measure"]').value = lot.unit_measure;
        lotForm.querySelector('input[name="project_ref"]').value = lot.project_ref || '';
        lotForm.querySelector('select[name="status"]').value = lot.status;
        lotForm.querySelector('textarea[name="notes"]').value = lot.notes || '';
        lotForm.querySelector('.panel-label').textContent = 'Edit lot';
        lotForm.querySelector('h3').textContent = 'Edit sample lot';
        lotForm.querySelector('button[type="submit"]').textContent = 'Save Changes';
        document.getElementById('lot-modal').showModal();
      });
    });
  } else {
    state.selectedInventoryLotId = null;
  }

  if (hasAccess("marketing")) {
    renderTable($("#marketing-table"), [
      { label: "Dispatch", key: "dispatch_id" },
      { label: "Lot", key: "lot_number" },
      { label: "Product", key: "product_name" },
      { label: "Customer", key: "customer_name" },
      { label: "Feedback", render: (r) => r.feedback_id ? statusBadge("Submitted") : statusBadge("Pending") },
      { label: "Actions", render: (r) => `
        <div class="table-actions">
          <button class='edit-marketing-btn' data-dispatch-id='${r.dispatch_id}'>${r.feedback_id ? "Edit Feedback" : "Add Feedback"}</button>
          ${r.feedback_id ? `<button class='delete-marketing-btn' data-feedback-id='${r.feedback_id}'>Delete</button>` : ""}
        </div>
      ` },
    ], state.dashboard.marketing, {
      selectedId: state.selectedDispatchId,
      onSelect: selectDispatch,
    });
    // Bind delete buttons for marketing (feedback by feedback id)
    document.querySelectorAll('.delete-marketing-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Delete this feedback?')) {
          await api(`/api/feedback/${btn.dataset.feedbackId}`, { method: 'DELETE' });
          await loadDashboard();
        }
      });
    });
    // Bind edit buttons for marketing (open feedback modal, prefilled when present)
    document.querySelectorAll('.edit-marketing-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const dispatchId = Number(btn.dataset.dispatchId);
        if (!dispatchId) return;
        state.selectedDispatchId = dispatchId;
        $("#feedback-trigger").disabled = false;
        const feedback = await api(`/api/feedback?dispatch_id=${dispatchId}`);
        const form = document.getElementById('feedback-form');
        form.reset();
        if (feedback?.id) {
          form.setAttribute('data-edit-id', String(feedback.id));
          form.querySelector('input[name="rating"]').value = feedback.rating;
          form.querySelector('input[name="marketing_person"]').value = feedback.marketing_person;
          form.querySelector('input[name="action_required"]').checked = !!feedback.action_required;
          form.querySelector('textarea[name="technical_notes"]').value = feedback.technical_notes;
          form.querySelector('textarea[name="next_steps"]').value = feedback.next_steps || '';
          form.querySelector('.panel-label').textContent = 'Edit feedback';
          form.querySelector('h3').textContent = 'Edit feedback';
          form.querySelector('button[type="submit"]').textContent = 'Save Changes';
        } else {
          form.removeAttribute('data-edit-id');
          form.querySelector('.panel-label').textContent = 'Market response';
          form.querySelector('h3').textContent = 'Add customer feedback';
          form.querySelector('button[type="submit"]').textContent = 'Save Feedback';
        }
        document.getElementById('feedback-modal').showModal();
      });
    });
  } else {
    state.selectedDispatchId = null;
  }

  if (hasAccess("quality") && state.selectedLotId) {
    await loadAnalyses(state.selectedLotId);
  } else {
    $("#analyses-table").innerHTML = `<div class="table-wrap"><div class="empty-state">Select a lot to inspect its test records.</div></div>`;
  }

  if (hasAccess("logistics") && state.selectedInventoryLotId) {
    await loadDispatches(state.selectedInventoryLotId);
  } else {
    $("#dispatches-table").innerHTML = `<div class="table-wrap"><div class="empty-state">Select a lot in inventory to manage dispatches.</div></div>`;
  }

  if (hasAccess("marketing") && state.selectedDispatchId) {
    await loadFeedback(state.selectedDispatchId);
  } else {
    $("#feedback-detail").innerHTML = `<div class="empty-state">Select a delivered shipment to review or log feedback.</div>`;
  }

  applyAccessUI();

  if (state.pendingScrollTo && window.matchMedia("(max-width: 900px)").matches) {
    const el = document.querySelector(state.pendingScrollTo);
    state.pendingScrollTo = "";
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function selectLot(id) {
  state.selectedLotId = id;
  $("#analysis-trigger").disabled = false;
  state.pendingScrollTo = "#analysis-context";
  await loadDashboard();
}

async function selectInventoryLot(id) {
  state.selectedInventoryLotId = id;
  $("#dispatch-trigger").disabled = false;
  state.pendingScrollTo = "#dispatch-context";
  await loadDashboard();
}

async function selectDispatch(id) {
  state.selectedDispatchId = id;
  $("#feedback-trigger").disabled = false;
  state.pendingScrollTo = "#feedback-context";
  await loadDashboard();
}

async function loadAnalyses(lotId) {
  const row = state.dashboard.lots.find((item) => item.id === lotId);
  $("#analysis-context").textContent = row ? `Analyses for ${row.lot_number} · ${row.product_name}` : "Select a lot to inspect its test records.";
  const analyses = await api(`/api/analyses?lot_id=${lotId}`);
  renderTable($("#analyses-table"), [
    { label: "Date", render: (r) => new Date(r.test_date).toLocaleDateString() },
    { label: "Test", key: "test_type" },
    { label: "Spec", key: "spec_value" },
    { label: "Result", key: "result_value" },
    { label: "Pass", render: (r) => statusBadge(r.is_pass ? "Pass" : "Fail") },
    { label: "Analyst", key: "analyst_name" },
    { label: "Actions", render: (r) => `
      <div class="table-actions">
        <button class='edit-analysis-btn' data-id='${r.id}'>Edit</button>
        <button class='delete-analysis-btn' data-id='${r.id}'>Delete</button>
      </div>
    ` },
  ], analyses, { empty: "No analyses logged yet." });
  // Bind delete buttons for analyses
  document.querySelectorAll('.delete-analysis-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Delete this analysis?')) {
        await api(`/api/analyses/${btn.dataset.id}`, { method: 'DELETE' });
        await loadAnalyses(lotId);
      }
    });
  });
  // Bind edit buttons for analyses (edit modal)
  document.querySelectorAll('.edit-analysis-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const analysisId = btn.dataset.id;
      api(`/api/analyses/${analysisId}`).then(analysis => {
        const form = document.getElementById('analysis-form');
        form.reset();
        form.setAttribute('data-edit-id', analysisId);
        form.querySelector('select[name="test_type"]').value = analysis.test_type;
        form.querySelector('input[name="spec_value"]').value = analysis.spec_value;
        form.querySelector('input[name="result_value"]').value = analysis.result_value;
        form.querySelector('input[name="analyst_name"]').value = analysis.analyst_name;
        form.querySelector('input[name="test_date"]').value = analysis.test_date.slice(0,10);
        form.querySelector('input[name="is_pass"]').checked = !!analysis.is_pass;
        form.querySelector('.panel-label').textContent = 'Edit analysis';
        form.querySelector('h3').textContent = 'Edit analysis';
        form.querySelector('button[type="submit"]').textContent = 'Save Changes';
        document.getElementById('analysis-modal').showModal();
      });
    });
  });
}

async function loadDispatches(lotId) {
  const row = state.dashboard.inventory.find((item) => item.id === lotId);
  $("#dispatch-context").textContent = row ? `Shipments for ${row.lot_number} · ${row.product_name}` : "Select a lot in inventory to manage dispatches.";
  const dispatches = await api(`/api/dispatches?lot_id=${lotId}`);
  const container = $("#dispatches-table");
  if (!dispatches.length) {
    container.innerHTML = `<div class="table-wrap"><div class="empty-state">No shipments logged yet.</div></div>`;
    return;
  }

  const statusOptions = (row) => ["Dispatched", "In-Transit", "Delivered"].map((status) => `<option ${status === row.delivery_status ? "selected" : ""}>${status}</option>`).join("");
  renderTable(container, [
    { label: "Dispatch", key: "id" },
    { label: "Customer", key: "customer_name" },
    { label: "Qty", key: "quantity_sent" },
    { label: "Courier", key: "courier_name" },
    { label: "AWB", key: "awb_number" },
    { label: "Date", render: (r) => new Date(r.dispatch_date).toLocaleDateString() },
    {
      label: "Status",
      render: (r) => `
        <select class="inline-select" data-dispatch-id="${r.id}">
          ${statusOptions(r)}
        </select>
      `,
    },
    { label: "Actions", render: (r) => `
      <div class="table-actions">
        <button class='edit-dispatch-btn' data-id='${r.id}'>Edit</button>
        <button class='delete-dispatch-btn' data-id='${r.id}'>Delete</button>
      </div>
    ` },
  ], dispatches, { layout: "auto" });

  container.querySelectorAll(".inline-select").forEach((select) => {
    select.addEventListener("change", async () => {
      await api("/api/dispatch-status", {
        method: "PATCH",
        body: JSON.stringify({
          dispatch_id: Number(select.dataset.dispatchId),
          delivery_status: select.value,
        }),
      });
      await loadDashboard();
    });
  });
  // Bind delete buttons for dispatches
  container.querySelectorAll('.delete-dispatch-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Delete this dispatch?')) {
        await api(`/api/dispatches/${btn.dataset.id}`, { method: 'DELETE' });
        await loadDispatches(lotId);
      }
    });
  });
  // Bind edit buttons for dispatches (edit modal)
  container.querySelectorAll('.edit-dispatch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dispatchId = btn.dataset.id;
      api(`/api/dispatches/${dispatchId}`).then(dispatch => {
        const form = document.getElementById('dispatch-form');
        form.reset();
        form.setAttribute('data-edit-id', dispatchId);
        form.querySelector('input[name="customer_name"]').value = dispatch.customer_name;
        form.querySelector('input[name="quantity_sent"]').value = dispatch.quantity_sent;
        form.querySelector('input[name="courier_name"]').value = dispatch.courier_name;
        form.querySelector('input[name="awb_number"]').value = dispatch.awb_number;
        form.querySelector('input[name="dispatch_date"]').value = dispatch.dispatch_date.slice(0,10);
        form.querySelector('.panel-label').textContent = 'Edit dispatch';
        form.querySelector('h3').textContent = 'Edit shipment';
        form.querySelector('button[type="submit"]').textContent = 'Save Changes';
        document.getElementById('dispatch-modal').showModal();
      });
    });
  });
}

async function loadFeedback(dispatchId) {
  const row = state.dashboard.marketing.find((item) => item.dispatch_id === dispatchId);
  $("#feedback-context").textContent = row ? `Feedback for dispatch ${row.dispatch_id} · ${row.lot_number}` : "Select a delivered shipment to review or log feedback.";
  const feedback = await api(`/api/feedback?dispatch_id=${dispatchId}`);
  $("#feedback-detail").innerHTML = feedback.id ? `
    <div class="feedback-card">
      <p><strong>Rating:</strong> ${feedback.rating}/5</p>
      <p><strong>Marketing:</strong> ${feedback.marketing_person}</p>
      <p><strong>Action Required:</strong> ${feedback.action_required ? "Yes" : "No"}</p>
      <p><strong>Technical Notes:</strong><br>${feedback.technical_notes}</p>
      <p><strong>Next Steps:</strong><br>${feedback.next_steps || "None recorded"}</p>
      <div class="table-actions" style="margin-top:12px;">
        <button class='edit-feedback-btn' data-id='${feedback.id}'>Edit</button>
        <button class='delete-feedback-btn' data-id='${feedback.id}'>Delete</button>
      </div>
    </div>
  ` : `<div class="empty-state">No feedback recorded for this delivered shipment.</div>`;
  // Bind delete button for feedback
  document.querySelectorAll('.delete-feedback-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Delete this feedback?')) {
        await api(`/api/feedback/${btn.dataset.id}`, { method: 'DELETE' });
        await loadFeedback(dispatchId);
      }
    });
  });
  // Bind edit button for feedback (edit modal)
  document.querySelectorAll('.edit-feedback-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const feedbackId = btn.dataset.id;
      api(`/api/feedback/${feedbackId}`).then(feedback => {
        const form = document.getElementById('feedback-form');
        form.reset();
        form.setAttribute('data-edit-id', feedbackId);
        form.querySelector('input[name="rating"]').value = feedback.rating;
        form.querySelector('input[name="marketing_person"]').value = feedback.marketing_person;
        form.querySelector('input[name="action_required"]').checked = !!feedback.action_required;
        form.querySelector('textarea[name="technical_notes"]').value = feedback.technical_notes;
        form.querySelector('textarea[name="next_steps"]').value = feedback.next_steps || '';
        form.querySelector('.panel-label').textContent = 'Edit feedback';
        form.querySelector('h3').textContent = 'Edit feedback';
        form.querySelector('button[type="submit"]').textContent = 'Save Changes';
        document.getElementById('feedback-modal').showModal();
      });
    });
  });
}

function formDataToObject(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

function bindForms() {
  const loginForm = $("#login-form");
  if (loginForm) {
    document.querySelectorAll(".demo-fill").forEach((button) => {
      button.addEventListener("click", () => {
        loginForm.elements.username.value = button.dataset.username;
        loginForm.elements.password.value = button.dataset.password;
        const err = $("#login-error");
        if (err) err.textContent = "";
      });
    });

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const err = $("#login-error");
      if (err) err.textContent = "";
      const submitButton = $("#login-button");
      const originalLabel = submitButton?.textContent || "Sign In";
      if (!submitButton) return;
      if (isGitHubPages() && !API_BASE_URL) {
        if (err) err.textContent = "Set window.API_BASE_URL in config.js to your backend URL.";
        return;
      }
      submitButton.disabled = true;
      submitButton.textContent = "Signing in...";
      const payload = formDataToObject(event.target);
      try {
        const result = await api("/api/login", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        state.token = result.token;
        localStorage.setItem("sample_tracking_token", state.token);
        location.assign(appHomeUrl());
      } catch (error) {
        if (err) err.textContent = error.message;
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    });
  }

  function setupCancel(form, modalId, resetTitle, resetH3, resetBtn) {
    const cancelButton = form.querySelector(".cancel-edit-btn");
    if (!cancelButton) return;
    cancelButton.onclick = function () {
      form.reset();
      form.removeAttribute("data-edit-id");
      const panelLabel = form.querySelector(".panel-label");
      if (panelLabel) panelLabel.textContent = resetTitle;
      const title = form.querySelector("h3");
      if (title) title.textContent = resetH3;
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.textContent = resetBtn;
      document.getElementById(modalId)?.close();
    };
  }

  const lotForm = $("#lot-form");
  if (lotForm) {
    setupCancel(lotForm, "lot-modal", "New lot", "Create a sample lot", "Save Lot");
    lotForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const editId = lotForm.getAttribute("data-edit-id");
        const payload = formDataToObject(event.target);
        if (editId) {
          await api(`/api/lots/${editId}`, { method: "PATCH", body: JSON.stringify(payload) });
          lotForm.removeAttribute("data-edit-id");
          lotForm.querySelector(".panel-label").textContent = "New lot";
          lotForm.querySelector("h3").textContent = "Create a sample lot";
          lotForm.querySelector('button[type="submit"]').textContent = "Save Lot";
        } else {
          await api("/api/lots", { method: "POST", body: JSON.stringify(payload) });
        }
        event.target.reset();
        document.getElementById("lot-modal")?.close();
        await loadDashboard();
      } catch (error) {
        alert(`Error saving lot: ${error.message}`);
      }
    });
  }

  const analysisForm = $("#analysis-form");
  if (analysisForm) {
    setupCancel(analysisForm, "analysis-modal", "Quality test", "Add analysis", "Save Analysis");
    analysisForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const editId = analysisForm.getAttribute("data-edit-id");
        const payload = formDataToObject(event.target);
        payload.lot_id = state.selectedLotId;
        payload.is_pass = event.target.elements.is_pass.checked;
        if (editId) {
          await api(`/api/analyses/${editId}`, { method: "PATCH", body: JSON.stringify(payload) });
          analysisForm.removeAttribute("data-edit-id");
          analysisForm.querySelector(".panel-label").textContent = "Quality test";
          analysisForm.querySelector("h3").textContent = "Add analysis";
          analysisForm.querySelector('button[type="submit"]').textContent = "Save Analysis";
        } else {
          await api("/api/analyses", { method: "POST", body: JSON.stringify(payload) });
        }
        event.target.reset();
        event.target.elements.test_date.value = new Date().toISOString().slice(0, 10);
        document.getElementById("analysis-modal")?.close();
        await loadDashboard();
      } catch (error) {
        alert(`Error saving analysis: ${error.message}`);
      }
    });
  }

  const dispatchForm = $("#dispatch-form");
  if (dispatchForm) {
    setupCancel(dispatchForm, "dispatch-modal", "Shipment", "Create dispatch", "Save Shipment");
    dispatchForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const editId = dispatchForm.getAttribute("data-edit-id");
        const payload = formDataToObject(event.target);
        payload.lot_id = state.selectedInventoryLotId;
        if (editId) {
          await api(`/api/dispatches/${editId}`, { method: "PATCH", body: JSON.stringify(payload) });
          dispatchForm.removeAttribute("data-edit-id");
          dispatchForm.querySelector(".panel-label").textContent = "Shipment";
          dispatchForm.querySelector("h3").textContent = "Create dispatch";
          dispatchForm.querySelector('button[type="submit"]').textContent = "Save Shipment";
        } else {
          await api("/api/dispatches", { method: "POST", body: JSON.stringify(payload) });
        }
        event.target.reset();
        event.target.elements.dispatch_date.value = new Date().toISOString().slice(0, 10);
        document.getElementById("dispatch-modal")?.close();
        await loadDashboard();
      } catch (error) {
        alert(`Error saving dispatch: ${error.message}`);
      }
    });
  }

  const feedbackForm = $("#feedback-form");
  if (feedbackForm) {
    setupCancel(feedbackForm, "feedback-modal", "Market response", "Add customer feedback", "Save Feedback");
    feedbackForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const editId = feedbackForm.getAttribute("data-edit-id");
        const payload = formDataToObject(event.target);
        payload.dispatch_id = state.selectedDispatchId;
        payload.action_required = event.target.elements.action_required.checked;
        if (editId) {
          await api(`/api/feedback/${editId}`, { method: "PATCH", body: JSON.stringify(payload) });
          feedbackForm.removeAttribute("data-edit-id");
          feedbackForm.querySelector(".panel-label").textContent = "Market response";
          feedbackForm.querySelector("h3").textContent = "Add customer feedback";
          feedbackForm.querySelector('button[type="submit"]').textContent = "Save Feedback";
        } else {
          await api("/api/feedback", { method: "POST", body: JSON.stringify(payload) });
        }
        event.target.reset();
        document.getElementById("feedback-modal")?.close();
        await loadDashboard();
      } catch (error) {
        alert(`Error saving feedback: ${error.message}`);
      }
    });
  }

  const logoutButton = $("#logout-button");
  if (logoutButton) logoutButton.addEventListener("click", async () => {
    try {
      await api("/api/logout", { method: "POST", body: JSON.stringify({}) });
    } catch (_) {
      // Ignore logout failures during local token cleanup.
    }
    state.token = "";
    state.user = null;
    state.role = null;
    state.dashboard = null;
    state.selectedLotId = null;
    state.selectedInventoryLotId = null;
    state.selectedDispatchId = null;
    localStorage.removeItem("sample_tracking_token");
    location.assign(loginUrl());
  });
}

function setDefaultDates() {
  const today = new Date().toISOString().slice(0, 10);
  const analysisForm = $("#analysis-form");
  if (analysisForm?.elements?.test_date) analysisForm.elements.test_date.value = today;
  const dispatchForm = $("#dispatch-form");
  if (dispatchForm?.elements?.dispatch_date) dispatchForm.elements.dispatch_date.value = today;
}

async function restoreSession() {
  if (!state.token) return showLogin("");
  try {
    await loadDashboard();
  } catch (error) {
    localStorage.removeItem("sample_tracking_token");
    state.token = "";
    showLogin("Session expired. Sign in again.");
  }
}

async function init() {
  bindModalButtons();
  bindForms();
  if (isGitHubPages() && !API_BASE_URL) {
    showLogin("Set window.API_BASE_URL in config.js to your Railway backend URL.");
    return;
  }
  // Keep `/login.html` isolated: no dashboard loads, no page redirects that can
  // continue running against the login DOM and surface scary JS errors.
  if (location.pathname.endsWith("/login.html")) {
    if (state.token) location.replace(appHomeUrl());
    return;
  }

  setDefaultDates();
  await restoreSession();
}

init().catch((error) => {
  console.error(error);
  document.body.insertAdjacentHTML("afterbegin", `<div class="empty-state" style="padding:16px">${error.message}</div>`);
});
