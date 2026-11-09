const express = require('express');
const router = express.Router();

const { getConnection } = require("../db");

router.get('/', async (req, res) => {
  try {
    const db = await getConnection();
    const [rows] = await db.execute("SELECT supermarket_id, supermarket_name FROM supermarkets");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching supermarkets:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/', async (req, res) => {
  const { supermarket_name } = req.body;

  if (!supermarket_name) {
    return res.status(400).json({ error: "Supermarket name is required" });
  }

  try {
    const db = await getConnection();
    const [result] = await db.execute(
      "INSERT INTO supermarkets (supermarket_name) VALUES (?)",
      [supermarket_name]
    );

    res.status(201).json({
      supermarket_id: result.insertId,
      supermarket_name
    });
  } catch (error) {
    console.error("Error adding supermarket:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
