// ===================================
// REQUESTER DASHBOARD
// ===================================

const requester = getCurrentUser();

function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

if (protectPage("REQUESTER")) {
    document.getElementById("welcomeUser").textContent =
        "Welcome, " + requester.username;
    loadRequesterDashboard();
}

// ===================================
// DASHBOARD STATISTICS + MY REQUESTS
// ===================================

async function loadRequesterDashboard() {
    let myRequests = [];
    try {
        const res = await fetch("/api/requests/mine/" + requester.user_id);
        const data = await res.json();
        myRequests = data.data || [];
    } catch (err) {
        document.getElementById("myRequests").innerHTML =
            '<p class="empty-state">Could not load your requests.</p>';
        return;
    }

    document.getElementById("totalRequests").textContent = myRequests.length;
    document.getElementById("openRequests").textContent =
        myRequests.filter(r => r.request_status === "OPEN").length;
    document.getElementById("fulfilledRequests").textContent =
        myRequests.filter(r => r.request_status === "FULFILLED").length;

    displayMyRequests(myRequests);
}

// ===================================
// SEARCH ORGANISATIONS
// ===================================

async function searchOrganisations() {
    const blood = document.getElementById("searchBlood").value;
    const city = document.getElementById("searchCity").value.trim();
    const results = document.getElementById("organisationResults");

    try {
        const res = await fetch("/api/organisations/search?bloodGroup=" +
            encodeURIComponent(blood) + "&city=" + encodeURIComponent(city));
        const data = await res.json();
        const matches = data.data || [];

        if (matches.length === 0) {
            results.innerHTML =
                '<p class="empty-state">No matching organisations found.</p>';
            return;
        }

        results.innerHTML = matches.map(function (org) {
            return `
                <div class="card" style="margin-bottom:15px;">
                    <h3>${esc(org.org_name)}</h3>
                    <p>${esc(org.org_type)} | ${esc(org.city)}</p>
                    <p style="margin-top:12px;"><strong>Available blood:</strong></p>
                    ${org.stock.length ?
                        org.stock.map(item => `
                            <p>${esc(item.blood_group)} : ${item.units_available} units</p>
                        `).join("")
                        : "<p>No inventory recorded for this blood group.</p>"}
                </div>`;
        }).join("");
    } catch (err) {
        results.innerHTML = '<p class="empty-state">Cannot reach the server.</p>';
    }
}

// ===================================
// SUBMIT BLOOD REQUEST
// ===================================

const requestForm = document.getElementById("bloodRequestForm");

if (requestForm) {
    requestForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const message = document.getElementById("requestMessage");

        try {
            const res = await fetch("/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requesterId: requester.user_id,
                    bloodGroup: document.getElementById("requestBlood").value,
                    units: Number(document.getElementById("requestUnits").value),
                    city: document.getElementById("requestCity").value.trim(),
                    urgency: document.getElementById("requestUrgency").value
                })
            });
            const data = await res.json();

            if (!data.status) {
                message.innerHTML = '<div class="alert alert-error">' + esc(data.message) + "</div>";
                return;
            }
            message.innerHTML =
                '<div class="alert alert-success">Blood request submitted successfully!</div>';
            requestForm.reset();
            loadRequesterDashboard();
        } catch (err) {
            message.innerHTML = '<div class="alert alert-error">Cannot reach the server.</div>';
        }
    });
}

// ===================================
// DISPLAY REQUESTS AND RESPONSES
// ===================================

function displayMyRequests(myRequests) {
    const container = document.getElementById("myRequests");

    if (myRequests.length === 0) {
        container.innerHTML =
            '<p class="empty-state">You have not submitted any requests yet.</p>';
        return;
    }

    container.innerHTML = myRequests.map(function (request) {
        return `
            <div class="card" style="margin-bottom:20px;">
                <h3>Request #${request.request_id}</h3>
                <p><strong>Blood Group:</strong> ${esc(request.blood_group)}</p>
                <p><strong>Units:</strong> ${request.units_required}</p>
                <p><strong>City:</strong> ${esc(request.city)}</p>
                <p><strong>Urgency:</strong> ${esc(request.urgency)}</p>
                <p><strong>Status:</strong> ${statusBadge(request.request_status)}</p>

                <h4 style="margin-top:18px;color:#9F1D35;">Organisation Responses</h4>

                ${request.responses.length ?
                    request.responses.map(function (response) {
                        return `
                            <div style="padding:12px 0;border-bottom:1px solid #eee;">
                                <p><strong>${esc(response.org_name)}</strong></p>
                                <p>Units offered: ${response.units_offered}</p>
                                <p>Status: ${statusBadge(response.response_status)}</p>
                                <p>${esc(response.message || "")}</p>
                            </div>`;
                    }).join("")
                    : '<p class="empty-state">No responses received yet.</p>'}
            </div>`;
    }).join("");
}







// // ===================================
// // REQUESTER DASHBOARD
// // ===================================

// const requester = getCurrentUser();

// if (requester && protectPage("REQUESTER")) {

//     document.getElementById("welcomeUser").textContent =
//         "Welcome, " + requester.username;

//     loadRequesterDashboard();
// }


// // ===================================
// // DASHBOARD STATISTICS
// // ===================================

// function loadRequesterDashboard() {

//     const requests = getData("requests");

//     const myRequests = requests.filter(function(r) {
//         return r.requester_id === requester.user_id;
//     });

//     document.getElementById("totalRequests").textContent =
//         myRequests.length;

//     document.getElementById("openRequests").textContent =
//         myRequests.filter(r => r.request_status === "OPEN").length;

//     document.getElementById("fulfilledRequests").textContent =
//         myRequests.filter(r => r.request_status === "FULFILLED").length;

//     displayMyRequests();
// }


// // ===================================
// // SEARCH ORGANISATIONS
// // ===================================

// function searchOrganisations() {

//     const blood = document.getElementById("searchBlood").value;

//     const city = document.getElementById("searchCity").value
//         .trim().toLowerCase();

//     const organisations = getData("organisations");
//     const inventory = getData("inventory");

//     const results = document.getElementById("organisationResults");

//     const matches = organisations.filter(function(org) {

//         if (org.verification_status !== "APPROVED") {
//             return false;
//         }

//         const cityMatch = !city ||
//             org.city.toLowerCase().includes(city);

//         const bloodMatch = !blood ||
//             inventory.some(function(item) {
//                 return item.org_id === org.org_id &&
//                        item.blood_group === blood &&
//                        item.units_available > 0;
//             });

//         return cityMatch && bloodMatch;
//     });

//     if (matches.length === 0) {
//         results.innerHTML =
//             '<p class="empty-state">No matching organisations found.</p>';
//         return;
//     }

//     results.innerHTML = matches.map(function(org) {

//         const stock = inventory.filter(function(item) {
//             return item.org_id === org.org_id &&
//                    (!blood || item.blood_group === blood);
//         });

//         return `
//             <div class="card" style="margin-bottom:15px;">
//                 <h3>${org.org_name}</h3>
//                 <p>${org.org_type} | ${org.city}</p>
//                 <p style="margin-top:12px;">
//                     <strong>Available blood:</strong>
//                 </p>

//                 ${stock.length ?
//                     stock.map(item => `
//                         <p>${item.blood_group} : 
//                         ${item.units_available} units</p>
//                     `).join("")
//                     : "<p>No inventory recorded for this blood group.</p>"
//                 }
//             </div>
//         `;

//     }).join("");
// }


// // ===================================
// // SUBMIT BLOOD REQUEST
// // ===================================

// const requestForm = document.getElementById("bloodRequestForm");

// if (requestForm) {

//     requestForm.addEventListener("submit", function(e) {

//         e.preventDefault();

//         const requests = getData("requests");

//         const newId =
//             Math.max(0, ...requests.map(r => r.request_id)) + 1;

//         const newRequest = {

//             request_id: newId,

//             requester_id: requester.user_id,

//             blood_group:
//                 document.getElementById("requestBlood").value,

//             units_required:
//                 Number(document.getElementById("requestUnits").value),

//             city:
//                 document.getElementById("requestCity").value.trim(),

//             urgency:
//                 document.getElementById("requestUrgency").value,

//             request_status: "OPEN"

//         };

//         requests.push(newRequest);

//         saveData("requests", requests);

//         document.getElementById("requestMessage").innerHTML =
//             '<div class="alert alert-success">Blood request submitted successfully!</div>';

//         requestForm.reset();

//         loadRequesterDashboard();

//     });

// }


// // ===================================
// // DISPLAY REQUESTS AND RESPONSES
// // ===================================

// function displayMyRequests() {

//     const requests = getData("requests");

//     const responses = getData("responses");

//     const organisations = getData("organisations");

//     const myRequests = requests.filter(function(r) {
//         return r.requester_id === requester.user_id;
//     });

//     const container = document.getElementById("myRequests");

//     if (myRequests.length === 0) {
//         container.innerHTML =
//             '<p class="empty-state">You have not submitted any requests yet.</p>';
//         return;
//     }

//     container.innerHTML = myRequests.map(function(request) {

//         const requestResponses = responses.filter(function(response) {
//             return response.request_id === request.request_id;
//         });

//         return `
//             <div class="card" style="margin-bottom:20px;">

//                 <h3>Request #${request.request_id}</h3>

//                 <p><strong>Blood Group:</strong> ${request.blood_group}</p>
//                 <p><strong>Units:</strong> ${request.units_required}</p>
//                 <p><strong>City:</strong> ${request.city}</p>
//                 <p><strong>Urgency:</strong> ${request.urgency}</p>

//                 <p><strong>Status:</strong>
//                     ${statusBadge(request.request_status)}
//                 </p>

//                 <h4 style="margin-top:18px;color:#9F1D35;">
//                     Organisation Responses
//                 </h4>

//                 ${requestResponses.length ?

//                     requestResponses.map(function(response) {

//                         const org = organisations.find(o =>
//                             o.org_id === response.org_id
//                         );

//                         return `
//                             <div style="padding:12px 0;border-bottom:1px solid #eee;">
//                                 <p><strong>${org ? org.org_name : "Organisation"}</strong></p>
//                                 <p>Units offered: ${response.units_offered}</p>
//                                 <p>Status: ${statusBadge(response.response_status)}</p>
//                                 <p>${response.message || ""}</p>
//                             </div>
//                         `;

//                     }).join("")

//                     : '<p class="empty-state">No responses received yet.</p>'
//                 }

//             </div>
//         `;

//     }).join("");
// }
