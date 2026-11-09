const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();

const { getConnection } = require("../db");

router.post("/", async (req, res) => {

  const { name, email, password, country, role, currency_code, supermarketLocation, supermarketType, supermarketName} = req.body;

  try {

      const db = await getConnection();
    const [existingCustomer] = await db.query("SELECT * FROM customers WHERE email = ?", [email]);
    const [existingOwner] = await db.query("SELECT * FROM owners WHERE email = ?", [email]);
    if (existingCustomer.length > 0 || existingOwner.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const table = role === "owner" ? "owners" : "customers";

    let query, params;
    if (role === "owner") {

      const [locationResult] = await db.query(
        "INSERT INTO supermarket_locations (location_name, supermarket_id, latitude, longitude, country, currency_code) VALUES (?, ?, ?, ?, ?, ?)",
        [supermarketName, supermarketType, supermarketLocation.lat, supermarketLocation.lng, country, currency_code]
      );

      query = `INSERT INTO ${table} (username, email, password_hash, location_id) VALUES (?, ?, ?, ?)`;
      params = [name, email, hashedPassword, locationResult.insertId];
    } else {
      query = `INSERT INTO ${table} (username, email, password_hash,country, currency_code) VALUES (?, ?, ?, ?, ?)`;
      params = [name, email, hashedPassword, country, currency_code];
    }

    await db.query(query, params);

    console.log("Sssuccccesssffullll Registration");
    res.status(201).json({ message: `${role} registered successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
