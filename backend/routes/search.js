const express = require('express');
const jwt = require("jsonwebtoken");
const router = express.Router();

const { getConnection } = require("../db");

router.get('/', async (req, res) => {
  const { query, supermarketType, lat, lng, radius } = req.query;
  let userCountry = null;

  try {
    const db = await getConnection();

    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const SECRET = process.env.JWT_SECRET_KEY || "defaultSecretKey";
      const decoded = jwt.verify(token, SECRET);
      userCountry = decoded.country;
    }

    if (!userCountry) {
      return res.status(400).json({ error: "User country not found" });
    }

let sql = `
  WITH product_search AS (
    SELECT DISTINCT
      p.product_id,
      p.product_name,
      p.image_path
    FROM products p
    WHERE 1=1 
    ${query && query !== 'all' ? 'AND p.product_name LIKE ?' : ''}
  ),
  location_filtered AS (
    SELECT 
      ps.*,
      s.supermarket_id,
      s.supermarket_name,
      s.image_path AS supermarket_image,
      sl.location_id,
      sl.location_name,
      sl.latitude,
      sl.longitude,
      sl.country,
      pr.price,
      pr.last_updated,
      pr.on_deal,
      ${lat && lng ? `
        (6371 * acos(
          cos(radians(${lat})) * 
          cos(radians(sl.latitude)) * 
          cos(radians(sl.longitude) - radians(${lng})) + 
          sin(radians(${lat})) * 
          sin(radians(sl.latitude))
        )) as distance
      ` : '0 as distance'}
    FROM product_search ps
    JOIN prices pr ON ps.product_id = pr.product_id
    JOIN supermarket_locations sl ON pr.location_id = sl.location_id
    JOIN supermarkets s ON sl.supermarket_id = s.supermarket_id
    WHERE sl.country = ?   -- filter by user's country
`;

const params = [];

if (query && query !== 'all') {
  params.push(`%${query}%`);
}

params.push(userCountry);

if (supermarketType) {
  sql += ` AND s.supermarket_id = ?`;
  params.push(supermarketType);
}

if (lat && lng && radius) {
  sql += ` HAVING distance <= ?`;
  params.push(radius);
}

    sql += `
      )
      SELECT 
        lf.*,
        (SELECT MIN(price) 
         FROM location_filtered lf2 
         WHERE lf2.product_id = lf.product_id) as min_price
      FROM location_filtered lf
      WHERE lf.price = (
        SELECT MIN(price) 
        FROM location_filtered lf2 
        WHERE lf2.product_id = lf.product_id
      )
      ORDER BY lf.product_name
    `;

    const [results] = await db.query(sql, params);

    const formattedResults = results.map(product => ({
      product_id: product.product_id,
      product_name: product.product_name,
      image_path: product.image_path,
      supermarket_name: product.supermarket_name,
      supermarket_image: product.supermarket_image,
      location_name: product.location_name,
      country: product.country,
      price: product.price,
      last_updated: product.last_updated,
      on_deal: product.on_deal,
      distance: product.distance
    }));

    res.json({ data: formattedResults });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
