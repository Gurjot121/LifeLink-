

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