

// require("dotenv").config({ path: __dirname + "/.env" });

require('dotenv').config();


var express = require("express");
var path = require("path");

let app = express();

const db = require('./server/config/db');

app.get('/api/test', async (req, res) => {
    const [rows] = await db.query('SHOW TABLES');
    res.json(rows);
});

//to start Server
app.listen(5000, function () {
    console.log("Server Started...");
})

//middleware
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//APIs go below this line

app.get("/", function (req, resp) {
    let filepath = __dirname + "/public/index.html";
    resp.sendFile(filepath);
})

app.get("/organization", function (req, resp) {
    let filepath = __dirname + "/public/organization.html";
    resp.sendFile(filepath);
})

app.get("/admin", function (req, resp) {
    let filepath = __dirname + "/public/admin.html";
    resp.sendFile(filepath);
})

app.get("/requester", function (req, resp) {
    let filepath = __dirname + "/public/requester.html";
    resp.sendFile(filepath);
})

// app.get("/login", function (req, resp) {
//     let filepath = __dirname + "/public/login.html";
//     resp.sendFile(filepath);
// })


// app.get("/register", function (req, resp) {
//     let filepath = __dirname + "/public/register.html";
//     resp.sendFile(filepath);
// })

app.post("/api/login", async function (req, resp) {
    const { username, password, role } = req.body;
    const conn = await db.getConnection();
    try {
        await conn.query("SET @uid = NULL, @role = NULL");
        await conn.query("CALL pkg_user_login_user(?, ?, @uid, @role)", [username, password]);
        const [rows] = await conn.query("SELECT @uid AS user_id, @role AS role");
        const user = rows[0];

        if (!user.user_id || user.role !== role) {
            return resp.status(401).json({ status: false, message: "Invalid username, password or role." });
        }
        resp.json({ status: true, userId: user.user_id, role: user.role });
    } catch (err) {
        console.log(err);
        resp.status(500).json({ status: false, message: "Server error" });
    } finally {
        conn.release();
    }
});

app.post("/api/register", async function (req, resp) {
    const { username, password, role, orgName, orgType, city } = req.body;

    if (!["REQUESTER", "ORGANISATION"].includes(role)) {
        return resp.status(400).json({ status: false, message: "Invalid role." });
    }
    if (role === "ORGANISATION" && (!orgName || !orgType || !city)) {
        return resp.status(400).json({ status: false, message: "Organisation details are required." });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query("SET @uid = NULL, @oid = NULL");

        await conn.query("CALL pkg_user_register_user(?, ?, ?, @uid)", [username, password, role]);
        const [rows] = await conn.query("SELECT @uid AS user_id");
        const userId = rows[0].user_id;

        if (role === "ORGANISATION") {
            await conn.query(
                "CALL pkg_user_register_organisation(?, ?, ?, ?, @oid)",
                [userId, orgName, orgType, city]
            );
        }

        await conn.commit();
        resp.json({ status: true, message: "Registration successful! Please login." });
    } catch (err) {
        await conn.rollback();
        if (err.code === "ER_DUP_ENTRY") {
            return resp.status(409).json({ status: false, message: "Username already exists." });
        }
        if (err.code === "ER_CHECK_CONSTRAINT_VIOLATED") {
            return resp.status(400).json({ status: false, message: "Invalid data." });
        }
        console.log(err);
        resp.status(500).json({ status: false, message: "Server error" });
    } finally {
        conn.release();
    }
});

async function getBloodGroupId(name) {
    const [rows] = await db.query(
        "SELECT blood_group_id FROM blood_groups WHERE blood_group_name = ?", [name]);
    return rows.length ? rows[0].blood_group_id : null;
}


// Submit a blood request
app.post("/api/requests", async function (req, resp) {
    const { requesterId, bloodGroup, units, city, urgency } = req.body;
    const conn = await db.getConnection();
    try {
        const bgId = await getBloodGroupId(bloodGroup);
        if (!bgId) {
            return resp.status(400).json({ status: false, message: "Unknown blood group." });
        }
        await conn.query("SET @rid = NULL");
        await conn.query("CALL pkg_request_create_request(?, ?, ?, ?, ?, @rid)",
            [requesterId, bgId, units, city, urgency]);
        const [rows] = await conn.query("SELECT @rid AS request_id");
        resp.json({ status: true, requestId: rows[0].request_id });
    } catch (err) {
        console.log(err);
        resp.status(500).json({ status: false, message: "Could not submit request." });
    } finally {
        conn.release();
    }
});


// Search approved organisations and their stock
app.get("/api/organisations/search", async function (req, resp) {
    const { bloodGroup, city } = req.query;
    let sql = `SELECT o.org_id, o.org_name, o.org_type, o.city,
                      bg.blood_group_name AS blood_group, i.units_available
               FROM organisations o
               LEFT JOIN inventory i ON i.org_id = o.org_id
               LEFT JOIN blood_groups bg ON bg.blood_group_id = i.blood_group_id
               WHERE o.verification_status = 'APPROVED'`;
    const params = [];
    if (city) { sql += " AND o.city LIKE ?"; params.push("%" + city + "%"); }
    if (bloodGroup) { sql += " AND bg.blood_group_name = ? AND i.units_available > 0"; params.push(bloodGroup); }

    try {
        const [rows] = await db.query(sql, params);
        const orgs = {};
        rows.forEach(function (r) {
            if (!orgs[r.org_id]) {
                orgs[r.org_id] = {
                    org_id: r.org_id, org_name: r.org_name,
                    org_type: r.org_type, city: r.city, stock: []
                };
            }
            if (r.blood_group) {
                orgs[r.org_id].stock.push({ blood_group: r.blood_group, units_available: r.units_available });
            }
        });
        resp.json({ status: true, data: Object.values(orgs) });
    } catch (err) {
        console.log(err);
        resp.status(500).json({ status: false, message: "Server error" });
    }
});

// My requests, each with its organisation responses
app.get("/api/requests/mine/:userId", async function (req, resp) {
    try {
        const [requests] = await db.query(
            `SELECT r.request_id, bg.blood_group_name AS blood_group, r.units_required,
                    r.city, r.urgency, r.request_status
             FROM blood_requests r
             JOIN blood_groups bg ON bg.blood_group_id = r.blood_group_id
             WHERE r.requester_id = ?
             ORDER BY r.request_id DESC`, [req.params.userId]);

        let responses = [];
        if (requests.length) {
            [responses] = await db.query(
                `SELECT rr.response_id, rr.request_id, o.org_name,
                        rr.units_offered, rr.response_status, rr.message
                 FROM request_responses rr
                 JOIN organisations o ON o.org_id = rr.org_id
                 WHERE rr.request_id IN (?)`, [requests.map(r => r.request_id)]);
        }
        requests.forEach(r => {
            r.responses = responses.filter(x => x.request_id === r.request_id);
        });
        resp.json({ status: true, data: requests });
    } catch (err) {
        console.log(err);
        resp.status(500).json({ status: false, message: "Server error" });
    }
});

// Organisation profile for the logged-in user
app.get("/api/org/profile/:userId", async function (req, resp) {
    try {
        const [rows] = await db.query(
            `SELECT org_id, org_name, org_type, city, verification_status
             FROM organisations WHERE user_id = ?`, [req.params.userId]);
        if (rows.length === 0) {
            return resp.status(404).json({ status: false, message: "Organisation profile not found." });
        }
        resp.json({ status: true, data: rows[0] });
    } catch (err) {
        console.log(err);
        resp.status(500).json({ status: false, message: "Server error" });
    }
});

// Inventory, matching incoming requests and accepted count in one call
app.get("/api/org/:orgId/dashboard", async function (req, resp) {
    const orgId = req.params.orgId;
    try {
        const [inventory] = await db.query(
            `SELECT bg.blood_group_name AS blood_group, i.units_available
             FROM inventory i
             JOIN blood_groups bg ON bg.blood_group_id = i.blood_group_id
             WHERE i.org_id = ? ORDER BY bg.blood_group_name`, [orgId]);

        const [incoming] = await db.query(
            `SELECT r.request_id, bg.blood_group_name AS blood_group,
                    r.units_required, r.city, r.urgency
             FROM blood_requests r
             JOIN blood_groups bg ON bg.blood_group_id = r.blood_group_id
             WHERE r.request_status = 'OPEN'
               AND EXISTS (SELECT 1 FROM inventory i
                           WHERE i.org_id = ? AND i.blood_group_id = r.blood_group_id
                             AND i.units_available > 0)
               AND NOT EXISTS (SELECT 1 FROM request_responses rr
                               WHERE rr.request_id = r.request_id AND rr.org_id = ?)
               AND EXISTS (SELECT 1 FROM organisations o
                           WHERE o.org_id = ? AND o.verification_status = 'APPROVED')
             ORDER BY r.request_id DESC`, [orgId, orgId, orgId]);

        const [acc] = await db.query(
            `SELECT COUNT(*) AS n FROM request_responses
             WHERE org_id = ? AND response_status = 'ACCEPTED'`, [orgId]);

        resp.json({ status: true, data: { inventory, incoming, acceptedCount: acc[0].n } });
    } catch (err) {
        console.log(err);
        resp.status(500).json({ status: false, message: "Server error" });
    }
});

// Update (or add) stock for one blood group
app.post("/api/org/:orgId/inventory", async function (req, resp) {
    const orgId = req.params.orgId;
    const { bloodGroup, units } = req.body;
    try {
        const [org] = await db.query(
            "SELECT verification_status FROM organisations WHERE org_id = ?", [orgId]);
        if (!org.length || org[0].verification_status !== "APPROVED") {
            return resp.status(403).json({ status: false, message: "Your organisation must be approved first." });
        }
        const bgId = await getBloodGroupId(bloodGroup);
        if (!bgId) return resp.status(400).json({ status: false, message: "Unknown blood group." });
        if (!Number.isInteger(units) || units < 0) {
            return resp.status(400).json({ status: false, message: "Units must be a whole number, 0 or more." });
        }

        const [existing] = await db.query(
            "SELECT inventory_id FROM inventory WHERE org_id = ? AND blood_group_id = ?", [orgId, bgId]);
        if (existing.length) {
            await db.query("CALL pkg_blood_update_stock(?, ?, ?)", [orgId, bgId, units]);
        } else {
            await db.query("CALL pkg_blood_add_stock(?, ?, ?)", [orgId, bgId, units]);
        }
        resp.json({ status: true });
    } catch (err) {
        console.log(err);
        resp.status(500).json({ status: false, message: "Could not update inventory." });
    }
});

// Accept or decline a request
app.post("/api/org/:orgId/respond", async function (req, resp) {
    const orgId = req.params.orgId;
    const { requestId, status } = req.body;
    const units = Number(req.body.units) || 0;
    try {
        const [org] = await db.query(
            "SELECT verification_status FROM organisations WHERE org_id = ?", [orgId]);
        if (!org.length || org[0].verification_status !== "APPROVED") {
            return resp.status(403).json({ status: false, message: "Your organisation must be approved first." });
        }

        const [reqRows] = await db.query(
            "SELECT blood_group_id, units_required, request_status FROM blood_requests WHERE request_id = ?",
            [requestId]);
        if (!reqRows.length || reqRows[0].request_status !== "OPEN") {
            return resp.status(400).json({ status: false, message: "This request is no longer open." });
        }

        const [done] = await db.query(
            "SELECT 1 FROM request_responses WHERE request_id = ? AND org_id = ?", [requestId, orgId]);
        if (done.length) {
            return resp.status(409).json({ status: false, message: "You have already responded to this request." });
        }

        let offered = 0;
        let message = "Organisation declined the request.";

        if (status === "ACCEPTED") {
            const [stock] = await db.query(
                "SELECT units_available FROM inventory WHERE org_id = ? AND blood_group_id = ?",
                [orgId, reqRows[0].blood_group_id]);
            if (!Number.isInteger(units) || units <= 0) {
                return resp.status(400).json({ status: false, message: "Please enter a valid number of units." });
            }
            if (!stock.length || units > stock[0].units_available) {
                return resp.status(400).json({ status: false, message: "Not enough blood units available." });
            }
            if (units > reqRows[0].units_required) {
                return resp.status(400).json({ status: false, message: "You cannot offer more units than requested." });
            }
            offered = units;
            message = "Organisation has offered blood units.";
        } else if (status !== "DECLINED") {
            return resp.status(400).json({ status: false, message: "Invalid response." });
        }

        await db.query("CALL pkg_request_respond_to_request(?, ?, ?, ?, ?)",
            [requestId, orgId, offered, status, message]);
        resp.json({ status: true });
    } catch (err) {
        console.log(err);
        if (err.sqlState === "45000") {
            return resp.status(400).json({ status: false, message: err.sqlMessage });
        }
        resp.status(500).json({ status: false, message: "Could not submit response." });
    }
});


// ADMIN ROUTES  

// Stats + all organisations in one call
app.get("/api/admin/dashboard", async function (req, resp) {
    try {
        const [organisations] = await db.query(
            `SELECT org_id, org_name, org_type, city, verification_status
             FROM organisations ORDER BY org_id`);

        const [reqCount] = await db.query(
            "SELECT COUNT(*) AS n FROM blood_requests");

        resp.json({
            status: true,
            data: { organisations, totalRequests: reqCount[0].n }
        });
    } catch (err) {
        console.log(err);
        resp.status(500).json({ status: false, message: "Server error" });
    }
});

// Approve or reject an organisation
app.post("/api/admin/organisations/:orgId/verify", async function (req, resp) {
    const { status } = req.body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
        return resp.status(400).json({ status: false, message: "Invalid status." });
    }

    try {
        const [result] = await db.query(
            "UPDATE organisations SET verification_status = ? WHERE org_id = ?",
            [status, req.params.orgId]);

        if (result.affectedRows === 0) {
            return resp.status(404).json({ status: false, message: "Organisation not found." });
        }
        resp.json({ status: true });
    } catch (err) {
        console.log(err);
        resp.status(500).json({ status: false, message: "Could not update organisation." });
    }
});