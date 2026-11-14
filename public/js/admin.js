
// ===================================
// ADMIN DASHBOARD
// ===================================

const adminUser = getCurrentUser();

if (adminUser && protectPage("ADMIN")) {
    loadAdminDashboard();
}


// ===================================
// LOAD ADMIN STATISTICS
// ===================================

function loadAdminDashboard() {

    const organisations = getData("organisations");
    const requests = getData("requests");

    document.getElementById("adminTotal").textContent =
        organisations.length;

    document.getElementById("adminPending").textContent =
        organisations.filter(o =>
            o.verification_status === "PENDING"
        ).length;

    document.getElementById("adminApproved").textContent =
        organisations.filter(o =>
            o.verification_status === "APPROVED"
        ).length;

    document.getElementById("adminRequests").textContent =
        requests.length;

    displayPendingOrganisations();
    displayAllOrganisations();

}


// ===================================
// DISPLAY PENDING ORGANISATIONS
// ===================================

function displayPendingOrganisations() {

    const organisations = getData("organisations");

    const pending = organisations.filter(function(org) {
        return org.verification_status === "PENDING";
    });

    const container =
        document.getElementById("pendingOrganisations");

    if (pending.length === 0) {

        container.innerHTML =
            '<p class="empty-state">No pending organisations.</p>';

        return;
    }

    container.innerHTML = pending.map(function(org) {

        return `
            <div class="card" style="margin-bottom:18px;">

                <h3>${org.org_name}</h3>

                <p><strong>Type:</strong> ${org.org_type}</p>

                <p><strong>City:</strong> ${org.city}</p>

                <p><strong>Status:</strong>
                    ${statusBadge(org.verification_status)}
                </p>

                <div class="search-row" style="margin-top:18px;">

                    <button class="btn btn-success"
                        onclick="verifyOrganisation(${org.org_id}, 'APPROVED')">
                        Approve
                    </button>

                    <button class="btn btn-danger"
                        onclick="verifyOrganisation(${org.org_id}, 'REJECTED')">
                        Reject
                    </button>

                </div>

            </div>
        `;

    }).join("");

}


// ===================================
// APPROVE OR REJECT ORGANISATION
// ===================================

function verifyOrganisation(orgId, status) {

    let organisations = getData("organisations");

    const org = organisations.find(function(o) {
        return o.org_id === orgId;
    });

    if (!org) return;

    org.verification_status = status;

    saveData("organisations", organisations);

    document.getElementById("adminMessage").innerHTML =
        `<div class="alert alert-success">
            Organisation ${status.toLowerCase()} successfully.
        </div>`;

    loadAdminDashboard();

}


// ===================================
// DISPLAY ALL ORGANISATIONS
// ===================================

function displayAllOrganisations() {

    const organisations = getData("organisations");

    const container = document.getElementById("allOrgTable");

    if (organisations.length === 0) {

        container.innerHTML =
            '<p class="empty-state">No organisations registered.</p>';

        return;
    }

    container.innerHTML = `

        <table>

            <thead>
                <tr>
                    <th>ID</th>
                    <th>Organisation</th>
                    <th>Type</th>
                    <th>City</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>

                ${organisations.map(function(org) {

                    return `
                        <tr>
                            <td>${org.org_id}</td>
                            <td>${org.org_name}</td>
                            <td>${org.org_type}</td>
                            <td>${org.city}</td>
                            <td>${statusBadge(org.verification_status)}</td>
                        </tr>
                    `;

                }).join("")}

            </tbody>

        </table>

    `;

}
