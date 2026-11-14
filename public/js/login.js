
// ===================================
// LIFELINK - COMMON JAVASCRIPT
// ===================================

// Sample data for frontend demonstration.
// This will later be replaced by Oracle API calls.

function initializeData() {

    if (!localStorage.getItem("users")) {

        const users = [
            {user_id: 1, username: "admin1", password: "admin123", role: "ADMIN"},
            {user_id: 2, username: "requester1", password: "user123", role: "REQUESTER"},
            {user_id: 3, username: "requester2", password: "user123", role: "REQUESTER"},
            {user_id: 4, username: "ngo1", password: "ngo123", role: "ORGANISATION"},
            {user_id: 5, username: "hospital1", password: "hospital123", role: "ORGANISATION"},
            {user_id: 6, username: "ngo2", password: "ngo123", role: "ORGANISATION"}
        ];

        localStorage.setItem("users", JSON.stringify(users));
    }

    if (!localStorage.getItem("organisations")) {

        const organisations = [
            {
                org_id: 1,
                user_id: 4,
                org_name: "Helping Hands NGO",
                org_type: "NGO",
                city: "Chandigarh",
                verification_status: "APPROVED"
            },
            {
                org_id: 2,
                user_id: 5,
                org_name: "City Care Hospital",
                org_type: "HOSPITAL",
                city: "Mohali",
                verification_status: "APPROVED"
            },
            {
                org_id: 3,
                user_id: 6,
                org_name: "Life Saver Foundation",
                org_type: "NGO",
                city: "Ludhiana",
                verification_status: "PENDING"
            }
        ];

        localStorage.setItem("organisations", JSON.stringify(organisations));
    }

    if (!localStorage.getItem("inventory")) {

        const inventory = [
            {inventory_id: 1, org_id: 1, blood_group: "A+", units_available: 10},
            {inventory_id: 2, org_id: 1, blood_group: "B+", units_available: 8},
            {inventory_id: 3, org_id: 1, blood_group: "O+", units_available: 15},
            {inventory_id: 4, org_id: 2, blood_group: "A+", units_available: 5},
            {inventory_id: 5, org_id: 2, blood_group: "AB+", units_available: 7},
            {inventory_id: 6, org_id: 2, blood_group: "O+", units_available: 12},
            {inventory_id: 7, org_id: 3, blood_group: "B+", units_available: 6},
            {inventory_id: 8, org_id: 3, blood_group: "O-", units_available: 4}
        ];

        localStorage.setItem("inventory", JSON.stringify(inventory));
    }

    if (!localStorage.getItem("requests")) {

        const requests = [
            {
                request_id: 1,
                requester_id: 2,
                blood_group: "A+",
                units_required: 4,
                city: "Chandigarh",
                urgency: "URGENT",
                request_status: "OPEN"
            },
            {
                request_id: 2,
                requester_id: 3,
                blood_group: "B+",
                units_required: 10,
                city: "Ludhiana",
                urgency: "NORMAL",
                request_status: "OPEN"
            }
        ];

        localStorage.setItem("requests", JSON.stringify(requests));
    }

    if (!localStorage.getItem("responses")) {

        const responses = [
            {
                response_id: 1,
                request_id: 1,
                org_id: 1,
                units_offered: 4,
                response_status: "ACCEPTED",
                message: "We can provide 4 units."
            },
            {
                response_id: 2,
                request_id: 2,
                org_id: 3,
                units_offered: 6,
                response_status: "PARTIAL",
                message: "We can provide 6 units."
            }
        ];

        localStorage.setItem("responses", JSON.stringify(responses));
    }
}

initializeData();


// ===================================
// COMMON DATA FUNCTIONS
// ===================================

function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
}


// ===================================
// LOGIN
// ===================================

// const loginForm = document.getElementById("loginForm");

// if (loginForm) {

//     loginForm.addEventListener("submit", function(e) {

//         e.preventDefault();

//         const username = document.getElementById("username").value.trim();
//         const password = document.getElementById("password").value;
//         const role = document.getElementById("role").value;

//         const users = getData("users");

//         const user = users.find(function(u) {
//             return u.username === username &&
//                    u.password === password &&
//                    u.role === role;
//         });

//         const message = document.getElementById("message");

//         if (!user) {
//             message.innerHTML =
//                 '<div class="alert alert-error">Invalid username, password or role.</div>';
//             return;
//         }

//         localStorage.setItem("currentUser", JSON.stringify(user));

//         if (user.role === "REQUESTER") {
//             window.location.href = "requester.html";
//         }
//         else if (user.role === "ORGANISATION") {
//             window.location.href = "organisation.html";
//         }
//         else if (user.role === "ADMIN") {
//             window.location.href = "admin.html";
//         }

//     });
// }
const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function(e) {

        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;
        const message = document.getElementById("message");

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, role })
            });
            const data = await res.json();

            if (!data.status) {
                message.innerHTML =
                    '<div class="alert alert-error">' + data.message + '</div>';
                return;
            }

            // keep this so her other pages (which read currentUser) still work
            localStorage.setItem("currentUser", JSON.stringify({
                user_id: data.userId,
                username: username,
                role: data.role
            }));

            if (data.role === "REQUESTER") {
                window.location.href = "requester.html";
            }
            else if (data.role === "ORGANIZATION") {
                window.location.href = "organization.html";   // check the spelling of the real file
            }
            else if (data.role === "ADMIN") {
                window.location.href = "admin.html";
            }

        } catch (err) {
            message.innerHTML =
                '<div class="alert alert-error">Cannot reach the server.</div>';
        }
    });
}

// ===================================
// REGISTRATION
// ===================================

const regRole = document.getElementById("regRole");

if (regRole) {

    regRole.addEventListener("change", function() {

        const fields = document.getElementById("organisationFields");

        fields.classList.toggle(
            "hidden",
            this.value !== "ORGANISATION"
        );

        document.getElementById("orgName").required =
            this.value === "ORGANISATION";

        document.getElementById("orgType").required =
            this.value === "ORGANISATION";

        document.getElementById("orgCity").required =
            this.value === "ORGANISATION";
    });
}


// const registerForm = document.getElementById("registerForm");

// if (registerForm) {

//     registerForm.addEventListener("submit", function(e) {

//         e.preventDefault();

//         const username = document.getElementById("regUsername").value.trim();
//         const password = document.getElementById("regPassword").value;
//         const role = document.getElementById("regRole").value;

//         const users = getData("users");

//         const message = document.getElementById("message");

//         const existing = users.find(function(u) {
//             return u.username.toLowerCase() === username.toLowerCase();
//         });

//         if (existing) {
//             message.innerHTML =
//                 '<div class="alert alert-error">Username already exists.</div>';
//             return;
//         }

//         const newUserId = Math.max(0, ...users.map(u => u.user_id)) + 1;

//         const newUser = {
//             user_id: newUserId,
//             username: username,
//             password: password,
//             role: role
//         };

//         users.push(newUser);
//         saveData("users", users);

//         if (role === "ORGANISATION") {

//             const organisations = getData("organisations");

//             const newOrgId =
//                 Math.max(0, ...organisations.map(o => o.org_id)) + 1;

//             organisations.push({
//                 org_id: newOrgId,
//                 user_id: newUserId,
//                 org_name: document.getElementById("orgName").value.trim(),
//                 org_type: document.getElementById("orgType").value,
//                 city: document.getElementById("orgCity").value.trim(),
//                 verification_status: "PENDING"
//             });

//             saveData("organisations", organisations);
//         }

//         message.innerHTML =
//             '<div class="alert alert-success">Registration successful! Please login.</div>';

//         registerForm.reset();

//         document.getElementById("organisationFields").classList.add("hidden");

//     });
// }
const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function(e) {

        e.preventDefault();

        const username = document.getElementById("regUsername").value.trim();
        const password = document.getElementById("regPassword").value;
        const role = document.getElementById("regRole").value;
        const message = document.getElementById("message");

        const body = { username, password, role };

        if (role === "ORGANISATION") {
            body.orgName = document.getElementById("orgName").value.trim();
            body.orgType = document.getElementById("orgType").value;
            body.city = document.getElementById("orgCity").value.trim();
        }

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (!data.status) {
                message.innerHTML =
                    '<div class="alert alert-error">' + data.message + '</div>';
                return;
            }

            message.innerHTML =
                '<div class="alert alert-success">' + data.message + '</div>';

            registerForm.reset();
            document.getElementById("organisationFields").classList.add("hidden");

        } catch (err) {
            message.innerHTML =
                '<div class="alert alert-error">Cannot reach the server.</div>';
        }
    });
}

// ===================================
// LOGOUT
// ===================================

function logout() {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}


// ===================================
// PAGE ACCESS PROTECTION
// ===================================

function protectPage(requiredRole) {

    const user = getCurrentUser();

    if (!user || user.role !== requiredRole) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}


// ===================================
// STATUS BADGE
// ===================================

function statusBadge(status) {

    const className = status.toLowerCase().replace("_", "-");

    return `<span class="badge badge-${className}">${status}</span>`;
}
