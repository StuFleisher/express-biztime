"use strict";

/** Database setup for BizTime. */

const { Client } = require("pg");

// const DB_URI = process.env.NODE_ENV === "test"  // 1
//     ? "postgresql:///biztime_test"
//     : "postgresql:///biztime";
const DB_URI = process.env.NODE_ENV === "test"  // 1
    ? "postgresql://ElectricSweater:newpassword@server/biztime_test "
    : "postgresql://ElectricSweater:newpassword@server/biztime ";

let db = new Client({
  connectionString: DB_URI
});

db.connect();                                   // 2

module.exports = db;                            // 3