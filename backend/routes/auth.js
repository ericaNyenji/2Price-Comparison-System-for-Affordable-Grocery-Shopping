const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();

const { getConnection } = require("../db");

router.post("/", async (req, res) => {
const { email, password } = req.body;

  try {

    const db = await getConnection();
    let [rows] = await db.query("SELECT * FROM customers WHERE email = ?", [email]);
    let user = rows[0];
    let role = "customer";

    if (!user) {
      [rows] = await db.query("SELECT * FROM owners WHERE email = ?", [email]);
      user = rows[0];
      role = "owner";
    }

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    let userCountry = null;
    let currencyCode = null;
    let locationName = null;

    if (role === "customer") {
      userCountry = user.country;
      currencyCode = user.currency_code || null;
    } else if (role === "owner") {

      const [locationRows] = await db.query(
        "SELECT country, currency_code, location_name FROM supermarket_locations WHERE location_id = ?",
        [user.location_id]
      );
      userCountry = locationRows[0]?.country || null;
      currencyCode = locationRows[0]?.currency_code || null;
      locationName = locationRows[0].location_name;
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        role: role,
        country: userCountry,
        currency_code: currencyCode,
        email: user.email,
        supermarket_location:locationName,
        name: user.username

      },
      process.env.JWT_SECRET_KEY || "defaultSecretKey",
      {
        expiresIn: "24h",
      }
    );

    res.json({
      token,
      role,
      userId: user.user_id,
      name: user.username,
      email: user.email,
      locationId: user.location_id,
      locationName: locationName,
      country: userCountry,
      currency_code: currencyCode,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
