const express = require('express');
const router = express.Router();

const { getConnection } = require("../db");
const jwt = require('jsonwebtoken');

let io;
const initializeSocket = (socketIO) => {
  io = socketIO;
};

router.get('/product/:productId/location/:locationId', async (req, res) => {
  try {
    const db = await getConnection();
    const [reviews] = await db.query(`
      SELECT r.*, c.username AS customer_name, sl.location_name
      FROM reviews r
      JOIN customers c ON r.customer_id = c.user_id
      JOIN supermarket_locations sl ON r.location_id = sl.location_id
      WHERE r.product_id = ? AND r.location_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.productId, req.params.locationId]);

    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = await getConnection();
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || "defaultSecretKey");

    const { product_id, location_id, rating, comment } = req.body;
    const [result] = await db.query(
      'INSERT INTO reviews (customer_id, product_id, location_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [decoded.userId, product_id, location_id, rating, comment]
    );

    const [[newReview]] = await db.query(`
      SELECT r.*, c.username AS customer_name, sl.location_name
      FROM reviews r
      JOIN customers c ON r.customer_id = c.user_id
      JOIN supermarket_locations sl ON r.location_id = sl.location_id
      WHERE r.review_id = ?
    `, [result.insertId]);

    if (io) io.emit('newReview', newReview);
    res.status(201).json(newReview);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', message: 'Please log in again' });
    }
    console.error('Error creating review:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

router.delete('/:reviewId', async (req, res) => {
  try {
    const db = await getConnection();
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || "defaultSecretKey");

    const { reviewId } = req.params;
    const [review] = await db.query('SELECT * FROM reviews WHERE review_id = ? AND customer_id = ?', [reviewId, decoded.userId]);
    if (!review.length) return res.status(403).json({ error: 'Not authorized to delete' });

    await db.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);
    if (io) io.emit('reviewDeleted', reviewId);

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', message: 'Please log in again' });
    }
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = { router, initializeSocket };
