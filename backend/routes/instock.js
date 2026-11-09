const express = require('express');
const router = express.Router();

const { getConnection } = require("../db");

router.get('/', async (req, res) => {
  const { locationId } = req.query;
  console.log("📥 Request received for locationId:", locationId);

  if (!locationId) return res.status(400).json({ error: "locationId is required" });

  try {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT
        p.product_id,
        p.product_name,
        p.image_path,
        p.category_id,
        c.category_name,      
        pr.price
      FROM products p
      JOIN prices pr ON pr.product_id = p.product_id
      JOIN categories c ON p.category_id = c.category_id  
      WHERE pr.location_id = ?
      
    `, [locationId]);

    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error("❌ SQL Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
