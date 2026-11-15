
// ===================================
// ADMIN DASHBOARD
// ===================================

function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

if (protectPage("ADMIN")) {
    loadAdminDashboard();
}


// ===================================
// LOAD ADMIN STATISTICS
// ===================================

async function loadAdminDashboard() {
    let d;
    try {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        if (!data.status) throw new Error(data.message);
        d = data.data;
    } catch (err) {
        document.getElementById("adminMessage").innerHTML =
            '<div class="alert alert-error">Could not load data from the server.</div>';
        return;
    }

    const orgs = d.organisations;

    document.getElementById("adminTotal").textContent = orgs.length;
    document.getElementById("adminPending").textContent =
        orgs.filter(o => o.verification_status === "PENDING").length;
    document.getElementById("adminApproved").textContent =
        orgs.filter(o => o.verification_status === "APPROVED").length;
    document.getElementById("adminRequests").textContent = d.totalRequests;

    displayPendingOrganisations(orgs);
    displayAllOrganisations(orgs);
}


// ===================================
// DISPLAY PENDING ORGANISATIONS
// ===================================

function displayPendingOrganisations(orgs) {
    const pending = orgs.filter(o => o.verification_status === "PENDING");
    const container = document.getElementById("pendingOrganisations");

    if (pending.length === 0) {
        container.innerHTML = '<p class="empty-state">No pending organisations.</p>';
        return;
    }

    container.innerHTML = pending.map(function (org) {
        return `
            <div class="card" style="margin-bottom:18px;">
                <h3>${esc(org.org_name)}</h3>
                <p><strong>Type:</strong> ${esc(org.org_type)}</p>
                <p><strong>City:</strong> ${esc(org.city)}</p>
                <p><strong>Status:</strong> ${statusBadge(org.verification_status)}</p>

                <div class="search-row" style="margin-top:18px;">
                    <button class="btn btn-success"
                        onclick="verifyOrganisation(${org.org_id}, 'APPROVED')">Approve</button>
                    <button class="btn btn-danger"
                        onclick="verifyOrganisation(${org.org_id}, 'REJECTED')">Reject</button>
                </div>
            </div>`;
    }).join("");
}


// ===================================
// APPROVE OR REJECT ORGANISATION
// ===================================

async function verifyOrganisation(orgId, status) {
    const msg = document.getElementById("adminMessage");

    try {
        const res = await fetch("/api/admin/organisations/" + orgId + "/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });
        const data = await res.json();

        if (!data.status) {
            msg.innerHTML = '<div class="alert alert-error">' + esc(data.message) + "</div>";
            return;
        }

        msg.innerHTML = '<div class="alert alert-success">Organisation ' +
            status.toLowerCase() + " successfully.</div>";
        loadAdminDashboard();
    } catch (err) {
        msg.innerHTML = '<div class="alert alert-error">Cannot reach the server.</div>';
    }
}


// ===================================
// DISPLAY ALL ORGANISATIONS
// ===================================

function displayAllOrganisations(orgs) {
    const container = document.getElementById("allOrgTable");

    if (orgs.length === 0) {
        container.innerHTML = '<p class="empty-state">No organisations registered.</p>';
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th><th>Organisation</th><th>Type</th><th>City</th><th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${orgs.map(org => `
                    <tr>
                        <td>${org.org_id}</td>
                        <td>${esc(org.org_name)}</td>
                        <td>${esc(org.org_type)}</td>
                        <td>${esc(org.city)}</td>
                        <td>${statusBadge(org.verification_status)}</td>
                    </tr>`).join("")}
            </tbody>
        </table>`;
}







// // ===================================
// // ADMIN DASHBOARD
// // ===================================

// const adminUser = getCurrentUser();

// if (adminUser && protectPage("ADMIN")) {
//     loadAdminDashboard();
// }


// // ===================================
// // LOAD ADMIN STATISTICS
// // ===================================

// function loadAdminDashboard() {

//     const organisations = getData("organisations");
//     const requests = getData("requests");

//     document.getElementById("adminTotal").textContent =
//         organisations.length;

//     document.getElementById("adminPending").textContent =
//         organisations.filter(o =>
//             o.verification_status === "PENDING"
//         ).length;

//     document.getElementById("adminApproved").textContent =
//         organisations.filter(o =>
//             o.verification_status === "APPROVED"
//         ).length;

//     document.getElementById("adminRequests").textContent =
//         requests.length;

//     displayPendingOrganisations();
//     displayAllOrganisations();

// }


// // ===================================
// // DISPLAY PENDING ORGANISATIONS
// // ===================================

// function displayPendingOrganisations() {

//     const organisations = getData("organisations");

//     const pending = organisations.filter(function(org) {
//         return org.verification_status === "PENDING";
//     });

//     const container =
//         document.getElementById("pendingOrganisations");

//     if (pending.length === 0) {

//         container.innerHTML =
//             '<p class="empty-state">No pending organisations.</p>';

//         return;
//     }

//     container.innerHTML = pending.map(function(org) {

//         return `
//             <div class="card" style="margin-bottom:18px;">

//                 <h3>${org.org_name}</h3>

//                 <p><strong>Type:</strong> ${org.org_type}</p>

//                 <p><strong>City:</strong> ${org.city}</p>

//                 <p><strong>Status:</strong>
//                     ${statusBadge(org.verification_status)}
//                 </p>

//                 <div class="search-row" style="margin-top:18px;">

//                     <button class="btn btn-success"
//                         onclick="verifyOrganisation(${org.org_id}, 'APPROVED')">
//                         Approve
//                     </button>

//                     <button class="btn btn-danger"
//                         onclick="verifyOrganisation(${org.org_id}, 'REJECTED')">
//                         Reject
//                     </button>

//                 </div>

//             </div>
//         `;

//     }).join("");

// }


// // ===================================
// // APPROVE OR REJECT ORGANISATION
// // ===================================

// function verifyOrganisation(orgId, status) {

//     let organisations = getData("organisations");

//     const org = organisations.find(function(o) {
//         return o.org_id === orgId;
//     });

//     if (!org) return;

//     org.verification_status = status;

//     saveData("organisations", organisations);

//     document.getElementById("adminMessage").innerHTML =
//         `<div class="alert alert-success">
//             Organisation ${status.toLowerCase()} successfully.
//         </div>`;

//     loadAdminDashboard();

// }


// // ===================================
// // DISPLAY ALL ORGANISATIONS
// // ===================================

// function displayAllOrganisations() {

//     const organisations = getData("organisations");

//     const container = document.getElementById("allOrgTable");

//     if (organisations.length === 0) {

//         container.innerHTML =
//             '<p class="empty-state">No organisations registered.</p>';

//         return;
//     }

//     container.innerHTML = `

//         <table>

//             <thead>
//                 <tr>
//                     <th>ID</th>
//                     <th>Organisation</th>
//                     <th>Type</th>
//                     <th>City</th>
//                     <th>Status</th>
//                 </tr>
//             </thead>

//             <tbody>

//                 ${organisations.map(function(org) {

//                     return `
//                         <tr>
//                             <td>${org.org_id}</td>
//                             <td>${org.org_name}</td>
//                             <td>${org.org_type}</td>
//                             <td>${org.city}</td>
//                             <td>${statusBadge(org.verification_status)}</td>
//                         </tr>
//                     `;

//                 }).join("")}

//             </tbody>

//         </table>

//     `;

// }
