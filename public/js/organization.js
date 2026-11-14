
// ===================================
// ORGANISATION DASHBOARD
// ===================================

const orgUser = getCurrentUser();

let currentOrg = null;

if (orgUser && protectPage("ORGANISATION")) {

    const organisations = getData("organisations");

    currentOrg = organisations.find(function(org) {
        return org.user_id === orgUser.user_id;
    });

    if (!currentOrg) {
        alert("Organisation profile not found.");
        logout();
    }
    else {
        document.getElementById("welcomeOrg").textContent =
            currentOrg.org_name;

        document.getElementById("orgHeading").textContent =
            currentOrg.org_name;

        loadOrganisationDashboard();
    }
}


// ===================================
// DASHBOARD STATISTICS
// ===================================

function loadOrganisationDashboard() {

    if (!currentOrg) return;

    const inventory = getData("inventory");
    const responses = getData("responses");

    const totalUnits = inventory
        .filter(i => i.org_id === currentOrg.org_id)
        .reduce((sum, i) => sum + Number(i.units_available), 0);

    const incoming = getData("requests").filter(function(request) {
        return request.request_status === "OPEN" &&
               currentOrg.verification_status === "APPROVED";
    });

    const accepted = responses.filter(function(response) {
        return response.org_id === currentOrg.org_id &&
               response.response_status === "ACCEPTED";
    });

    document.getElementById("totalUnits").textContent = totalUnits;

    document.getElementById("incomingCount").textContent =
        currentOrg.verification_status === "APPROVED" ?
        incoming.length : 0;

    document.getElementById("acceptedCount").textContent =
        accepted.length;

    const notice = document.getElementById("verificationNotice");

    if (currentOrg.verification_status !== "APPROVED") {

        notice.innerHTML = `
            <div class="alert alert-error">
                Your organisation is ${currentOrg.verification_status}.
                You can manage your profile after admin approval.
            </div>
        `;

    } else {
        notice.innerHTML = `
            <div class="alert alert-success">
                Your organisation has been verified.
            </div>
        `;
    }

    displayInventory();
    displayIncomingRequests();
}


// ===================================
// UPDATE INVENTORY
// ===================================

const inventoryForm = document.getElementById("inventoryForm");

if (inventoryForm) {

    inventoryForm.addEventListener("submit", function(e) {

        e.preventDefault();

        if (!currentOrg ||
            currentOrg.verification_status !== "APPROVED") {

            alert("Your organisation must be approved first.");
            return;
        }

        const bloodGroup =
            document.getElementById("inventoryBlood").value;

        const units =
            Number(document.getElementById("inventoryUnits").value);

        let inventory = getData("inventory");

        const existing = inventory.find(function(item) {
            return item.org_id === currentOrg.org_id &&
                   item.blood_group === bloodGroup;
        });

        if (existing) {

            existing.units_available = units;

        } else {

            const newId =
                Math.max(0, ...inventory.map(i => i.inventory_id)) + 1;

            inventory.push({
                inventory_id: newId,
                org_id: currentOrg.org_id,
                blood_group: bloodGroup,
                units_available: units
            });

        }

        saveData("inventory", inventory);

        document.getElementById("inventoryMessage").innerHTML =
            '<div class="alert alert-success">Inventory updated successfully.</div>';

        inventoryForm.reset();

        loadOrganisationDashboard();

    });

}


// ===================================
// DISPLAY INVENTORY
// ===================================

function displayInventory() {

    const inventory = getData("inventory").filter(function(item) {
        return item.org_id === currentOrg.org_id;
    });

    const container = document.getElementById("inventoryTable");

    if (inventory.length === 0) {

        container.innerHTML =
            '<p class="empty-state">No inventory available.</p>';

        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Blood Group</th>
                    <th>Units Available</th>
                </tr>
            </thead>

            <tbody>
                ${inventory.map(item => `
                    <tr>
                        <td>${item.blood_group}</td>
                        <td>${item.units_available}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}


// ===================================
// DISPLAY INCOMING REQUESTS
// ===================================

function displayIncomingRequests() {

    const requests = getData("requests");

    const responses = getData("responses");

    const container = document.getElementById("incomingRequests");

    if (currentOrg.verification_status !== "APPROVED") {

        container.innerHTML =
            '<p class="empty-state">Waiting for admin verification.</p>';

        return;
    }

    const inventory = getData("inventory");

    const availableGroups = inventory.filter(i =>
        i.org_id === currentOrg.org_id &&
        i.units_available > 0
    );

    const incoming = requests.filter(function(request) {

        const hasBlood = availableGroups.some(function(item) {
            return item.blood_group === request.blood_group;
        });

        const alreadyResponded = responses.some(function(response) {
            return response.request_id === request.request_id &&
                   response.org_id === currentOrg.org_id;
        });

        return request.request_status === "OPEN" &&
               hasBlood &&
               !alreadyResponded;

    });

    if (incoming.length === 0) {

        container.innerHTML =
            '<p class="empty-state">No matching incoming requests.</p>';

        return;
    }

    container.innerHTML = incoming.map(function(request) {

        return `
            <div class="card" style="margin-bottom:18px;">

                <h3>Request #${request.request_id}</h3>

                <p><strong>Blood Group:</strong> ${request.blood_group}</p>
                <p><strong>Units Required:</strong> ${request.units_required}</p>
                <p><strong>City:</strong> ${request.city}</p>
                <p><strong>Urgency:</strong> ${request.urgency}</p>

                <div class="search-row" style="margin-top:18px;">

                    <input type="number"
                           id="offer-${request.request_id}"
                           min="1"
                           max="${request.units_required}"
                           placeholder="Units to offer">

                    <button class="btn btn-success"
                        onclick="respondToRequest(${request.request_id}, 'ACCEPTED')">
                        Accept
                    </button>

                    <button class="btn btn-danger"
                        onclick="respondToRequest(${request.request_id}, 'DECLINED')">
                        Decline
                    </button>

                </div>

            </div>
        `;

    }).join("");

}


// ===================================
// RESPOND TO REQUEST
// ===================================

function respondToRequest(requestId, status) {

    if (!currentOrg ||
        currentOrg.verification_status !== "APPROVED") {
        return;
    }

    let responses = getData("responses");

    const requests = getData("requests");

    const request = requests.find(r =>
        r.request_id === requestId
    );

    if (!request) return;

    const alreadyResponded = responses.some(r =>
        r.request_id === requestId &&
        r.org_id === currentOrg.org_id
    );

    if (alreadyResponded) {
        alert("You have already responded to this request.");
        return;
    }

    let offeredUnits = 0;

    if (status === "ACCEPTED") {

        offeredUnits = Number(
            document.getElementById("offer-" + requestId).value
        );

        const inventory = getData("inventory");

        const stock = inventory.find(i =>
            i.org_id === currentOrg.org_id &&
            i.blood_group === request.blood_group
        );

        if (!offeredUnits || offeredUnits <= 0) {
            alert("Please enter a valid number of units.");
            return;
        }

        if (!stock || offeredUnits > stock.units_available) {
            alert("Not enough blood units available.");
            return;
        }

        if (offeredUnits > request.units_required) {
            alert("You cannot offer more units than requested.");
            return;
        }
    }

    const newId =
        Math.max(0, ...responses.map(r => r.response_id)) + 1;

    responses.push({

        response_id: newId,
        request_id: requestId,
        org_id: currentOrg.org_id,
        units_offered: offeredUnits,
        response_status: status,
        message: status === "ACCEPTED" ?
            "Organisation has offered blood units." :
            "Organisation declined the request."

    });

    saveData("responses", responses);

    loadOrganisationDashboard();

    alert("Your response has been submitted.");

}
