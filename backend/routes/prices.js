const express = require('express');
const router = express.Router();

const { getConnection } = require("../db");

router.get('/', async (req, res) => {
  try {
    const db = await getConnection();
    const [results] = await db.query('SELECT * FROM prices');
    res.json({ status: 'success', data: results });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/product/:productId', async (req, res) => {
  try {
    const db = await getConnection();
    const [results] = await db.query('SELECT * FROM prices WHERE product_id = ?', [req.params.productId]);
    res.json({ status: 'success', data: results });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = await getConnection();
    const { product_id, price, location_id } = req.body;

    const [existing] = await db.query('SELECT * FROM prices WHERE product_id = ? AND location_id = ?', [product_id, location_id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Product already exists in the supermarket' });
    }
    const [result] = await db.query('INSERT INTO prices (product_id, price, location_id) VALUES (?, ?, ?)', [product_id, price, location_id]);
    res.status(201).json({ status: 'success', data: { id: result.insertId, product_id, price, location_id } });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const db = await getConnection();
    const { product_id, price, location_id } = req.body;
    const [result] = await db.query('UPDATE prices SET product_id = ?, price = ?, location_id = ? WHERE id = ?', [product_id, price, location_id, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.json({ status: 'success', message: 'Price updated' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = await getConnection();
    const [result] = await db.query('DELETE FROM prices WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.json({ status: 'success', message: 'Price deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
