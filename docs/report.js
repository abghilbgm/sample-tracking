const reportState = {
    allData: [],
    filteredData: [],
    sortColumn: "dispatch_date",
    sortOrder: "desc",
    token: localStorage.getItem("sample_tracking_token") || "",
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const API_BASE_URL = String(window.API_BASE_URL || "").trim().replace(/\/+$/, "");

function resolveApiUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    if (!path.startsWith("/")) path = `/${path}`;
    if (API_BASE_URL) return `${API_BASE_URL}${path}`;
    return path;
}

async function api(path, options = {}) {
    const response = await fetch(resolveApiUrl(path), {
        headers: {
            "Content-Type": "application/json",
            ...(reportState.token ? { "X-Auth-Token": reportState.token } : {}),
            ...(options.headers || {}),
        },
        ...options,
    });
    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Request failed: ${response.status}`);
    }
    return response.json();
}

async function loadReportData() {
    try {
        const data = await api("/api/report");
        reportState.allData = data || [];
        reportState.filteredData = [...reportState.allData];
        renderTable();
        updateRecordCount();
    } catch (error) {
        console.error("Error loading report data:", error);
        showEmptyState("Failed to load data. Please check your connection.");
    }
}

function formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getStatusColor(status) {
    const statusMap = {
        "Dispatched": "dispatched",
        "In Transit": "in-transit",
        "Delivered": "delivered",
    };
    return statusMap[status] || "dispatched";
}

function renderStars(rating) {
    if (!rating) return "-";
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0 ? "½" : "";
    return "★".repeat(fullStars) + halfStar || "-";
}

function filterAndSort() {
    const searchTerm = $("#searchCustomer").value.toLowerCase();
    const statusFilter = $("#filterStatus").value;
    const startDate = $("#filterStartDate").value;
    const endDate = $("#filterEndDate").value;

    reportState.filteredData = reportState.allData.filter((row) => {
        // Search filter
        if (searchTerm) {
            const customerMatch = row.customer_name?.toLowerCase().includes(searchTerm);
            const lotMatch = row.lot_number?.toLowerCase().includes(searchTerm);
            const productMatch = row.product_name?.toLowerCase().includes(searchTerm);
            if (!customerMatch && !lotMatch && !productMatch) return false;
        }

        // Status filter
        if (statusFilter && row.status !== statusFilter) return false;

        // Date range filter
        if (startDate) {
            const rowDate = new Date(row.dispatch_date).getTime();
            const filterDate = new Date(startDate).getTime();
            if (rowDate < filterDate) return false;
        }

        if (endDate) {
            const rowDate = new Date(row.dispatch_date).getTime();
            const filterDate = new Date(endDate).getTime();
            if (rowDate > filterDate) return false;
        }

        return true;
    });

    // Sort data
    reportState.filteredData.sort((a, b) => {
        const aVal = a[reportState.sortColumn];
        const bVal = b[reportState.sortColumn];

        // Handle dates
        if (reportState.sortColumn.includes("date")) {
            const aDate = new Date(aVal || 0).getTime();
            const bDate = new Date(bVal || 0).getTime();
            return reportState.sortOrder === "asc" ? aDate - bDate : bDate - aDate;
        }

        // Handle numbers
        if (typeof aVal === "number" && typeof bVal === "number") {
            return reportState.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }

        // Handle strings
        const aStr = (aVal || "").toString().toLowerCase();
        const bStr = (bVal || "").toString().toLowerCase();
        const comparison = aStr.localeCompare(bStr);
        return reportState.sortOrder === "asc" ? comparison : -comparison;
    });

    renderTable();
    updateRecordCount();
}

function renderTable() {
    const tbody = $("#tableBody");
    tbody.innerHTML = "";

    if (reportState.filteredData.length === 0) {
        showEmptyState();
        return;
    }

    document.getElementById("emptyState").style.display = "none";

    reportState.filteredData.forEach((row) => {
        const statusColor = getStatusColor(row.status);
        const tr = document.createElement("tr");
        tr.className = `row-${statusColor}`;

        tr.innerHTML = `
            <td>${formatDate(row.sample_requisition_date)}</td>
            <td><strong>${row.customer_name}</strong></td>
            <td>${row.lot_number}</td>
            <td>${row.product_name}</td>
            <td>${row.quantity_sent} ${row.unit_measure || ""}</td>
            <td>${formatDate(row.dispatch_date)}</td>
            <td>
                <span class="status-badge status-${statusColor}">
                    ${row.status}
                </span>
            </td>
            <td>${row.courier_name || "-"}</td>
            <td>${row.awb_number || "-"}</td>
            <td>${row.rating ? `<span class="rating-stars">${renderStars(row.rating)}</span> (${row.rating})` : "-"}</td>
            <td>${row.action_required ? '<span class="action-required">⚠️ Action Required</span>' : row.technical_notes || "-"}</td>
        `;

        tbody.appendChild(tr);
    });
}

function showEmptyState(message = null) {
    document.getElementById("emptyState").style.display = "block";
    document.getElementById("emptyState").innerHTML = `
        <div class="empty-state-icon">📭</div>
        <p>${message || "No records found. Try adjusting your filters."}</p>
    `;
}

function updateRecordCount() {
    const count = reportState.filteredData.length;
    document.getElementById("recordCount").textContent = count;
}

function updateSortColumn(column) {
    if (reportState.sortColumn === column) {
        reportState.sortOrder = reportState.sortOrder === "asc" ? "desc" : "asc";
    } else {
        reportState.sortColumn = column;
        reportState.sortOrder = "asc";
    }

    // Update visual indicators
    $$("th.sortable").forEach((th) => {
        th.classList.remove("sort-asc", "sort-desc");
        if (th.dataset.column === column) {
            th.classList.add(reportState.sortOrder === "asc" ? "sort-asc" : "sort-desc");
        }
    });

    filterAndSort();
}

function resetFilters() {
    $("#searchCustomer").value = "";
    $("#filterStatus").value = "";
    $("#filterStartDate").value = "";
    $("#filterEndDate").value = "";
    reportState.sortColumn = "dispatch_date";
    reportState.sortOrder = "desc";

    $$("th.sortable").forEach((th) => {
        th.classList.remove("sort-asc", "sort-desc");
    });

    filterAndSort();
}

function printReport() {
    // Update title for print
    document.title = "Sample Tracking Report";
    window.print();
    // Restore title
    document.title = "Report Portal - Sample Tracking";
}

function initializeEventListeners() {
    // Apply filters button
    document.getElementById("applyFilters").addEventListener("click", filterAndSort);

    // Reset button
    document.getElementById("resetFilters").addEventListener("click", resetFilters);

    // Print button
    document.getElementById("printReport").addEventListener("click", printReport);

    // Search input - filter on enter or after delay
    const searchInput = document.getElementById("searchCustomer");
    let searchTimeout;
    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterAndSort, 300);
    });

    // Status filter - immediate filter
    document.getElementById("filterStatus").addEventListener("change", filterAndSort);

    // Date filters - immediate filter
    document.getElementById("filterStartDate").addEventListener("change", filterAndSort);
    document.getElementById("filterEndDate").addEventListener("change", filterAndSort);

    // Column header sorting
    $$("th.sortable").forEach((th) => {
        th.addEventListener("click", () => {
            updateSortColumn(th.dataset.column);
        });
    });

    // Back to dashboard
    const backLink = document.querySelector(".back-link");
    if (backLink) {
        backLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = new URL("./", location.href).toString();
        });
    }
}

function updateGeneratedTime() {
    const now = new Date();
    const timeStr = now.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    document.getElementById("generatedTime").textContent = timeStr;
}

async function initialize() {
    try {
        // Check if user is authenticated
        if (!reportState.token) {
            location.href = new URL("login.html", new URL("./", location.href)).toString();
            return;
        }

        updateGeneratedTime();
        initializeEventListeners();
        await loadReportData();
    } catch (error) {
        console.error("Initialization error:", error);
        if (error.message.includes("401") || error.message.includes("Authentication")) {
            location.href = new URL("login.html", new URL("./", location.href)).toString();
        } else {
            showEmptyState(`Error: ${error.message}`);
        }
    }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", initialize);
