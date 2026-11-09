const express = require('express');
const router = express.Router();

const { getConnection } = require("../db");

router.get('/', async (req, res) => {
    try {
      const db = await getConnection();
      const query = 'SELECT * FROM categories';

      const [results] = await db.query(query);

      res.json({ data: results });

    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });

    }
  });

  module.exports = router;