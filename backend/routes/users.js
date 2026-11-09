const express = require("express");
const router = express.Router();

const { getConnection } = require("../db");
const jwt = require("jsonwebtoken");

router.get("/:id", async (req, res) => {
  const userId = req.params.id;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const db = await getConnection();

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || "defaultSecretKey");
     const userRole = decoded.role;

    const table = userRole === "owner" ? "owners" : "customers";
    console.log("Querying table:", table);

    let query;
    if (userRole === "owner") {
      query = `
        SELECT o.user_id, o.username, o.email, sl.location_name as location, sl.country AS country
        FROM owners o
        LEFT JOIN supermarket_locations sl ON o.location_id = sl.location_id
        WHERE o.user_id = ?
      `;
    } else {
      query = `SELECT user_id, username, email, country FROM ${table} WHERE user_id = ?`;
    }

    const [rows] = await db.query(query, [userId]);
    console.log("Query result:", rows[0]);

    if (rows.length > 0) {
      console.log("Sending user data:", rows[0]);
      return res.json({ user: rows[0] });
    }

    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    console.error("Error fetching user:", error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: "Token expired",
        message: "Please log in again"
      });
    }
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;