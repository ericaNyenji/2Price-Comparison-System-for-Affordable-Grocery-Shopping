const express = require('express');
const router = express.Router();

const { getConnection } = require("../db");
const { createPriceChangeAlert } = require('./alerts');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  try {
    const db = await getConnection();
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || "defaultSecretKey");

    const [owner] = await db.query(
      'SELECT location_id FROM owners WHERE user_id = ?',
      [decoded.userId]
    );

    if (!owner || !owner[0]) {
      return res.status(403).json({ error: 'Owner not found' });
    }

    decoded.location_id = owner[0].location_id;
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please log in again'
      });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {

    const originalName = path.parse(file.originalname).name;
    const extension = path.parse(file.originalname).ext;
    const uniqueSuffix = Date.now();
    cb(null, `${originalName}-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {

    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { locationId } = req.query;

  try {
    const db = await getConnection();
    const [rows] = await db.query(`
      SELECT p.*, pr.price, pr.on_deal
      FROM products p 
      JOIN prices pr ON p.product_id = pr.product_id 
      WHERE p.product_id = ? AND pr.location_id = ?
    `, [id, locationId]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = rows[0];

    let dealData = null;

    if (product.on_deal) {
      const [dealRows] = await db.query(`
        SELECT deal_percentage, deal_end_date
        FROM deals 
        WHERE product_id = ? AND location_id = ?
        ORDER BY deal_start_date DESC 
        LIMIT 1
      `, [id, locationId]);

      if (dealRows.length) {
        const deal = dealRows[0];
        const discount = deal.deal_percentage;
        const deal_price = Math.round(product.price - (product.price * discount / 100));

        dealData = {
          discount_percentage: discount,
          deal_price,
          deal_end_date: deal.deal_end_date
        };
      }
    }

    res.json({
      status: 'success',
      data: {
        ...product,
        on_deal: !!product.on_deal,
        deal: dealData
      }
    });
  } catch (err) {
    console.error("❌ DB error:", err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { price, locationId } = req.body;

  try {
    const db = await getConnection();

    const [oldPriceRows] = await db.query(`
      SELECT price FROM prices 
      WHERE product_id = ? AND location_id = ?
    `, [id, locationId]);

    if (oldPriceRows.length === 0) {
      return res.status(404).json({ error: 'Price entry not found' });
    }

    const oldPrice = parseFloat(oldPriceRows[0].price);
    const newPrice = parseFloat(price);

    const [result] = await db.query(`
      UPDATE prices 
      SET price = ? 
      WHERE product_id = ? AND location_id = ?
    `, [newPrice, id, locationId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Price entry not found' });
    }

    const [productDetails] = await db.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.image_path,
        pr.price_id,
        pr.price,
        pr.on_deal,
        sl.location_name,
        s.supermarket_name,
        s.image_path AS supermarket_image,
        pr.location_id
      FROM prices pr
      JOIN products p ON pr.product_id = p.product_id
      JOIN supermarket_locations sl ON pr.location_id = sl.location_id
      JOIN supermarkets s ON sl.supermarket_id = s.supermarket_id
      WHERE pr.product_id = ? AND pr.location_id = ?
    `, [id, locationId]);

    if (productDetails.length > 0) {
      const product = productDetails[0];

      if (req.app.get('io')) {
        req.app.get('io').emit('priceUpdated', product);
      }

      if (newPrice < oldPrice) {

        const [favoriteUsers] = await db.query(
          'SELECT user_id FROM favorites WHERE product_id = ?',
          [id]
        );

        for (const user of favoriteUsers) {
          const priceDrop = oldPrice - newPrice;
          const dropPercentage = ((priceDrop / oldPrice) * 100).toFixed(1);
          const message = `${product.product_name} price dropped from $${oldPrice} to $${newPrice} (${dropPercentage}% savings) at ${product.supermarket_name} ${product.location_name}`;

          await createPriceChangeAlert(
            user.user_id,
            'customer',
            id,
            locationId,
            oldPrice,
            newPrice,
            message
          );
        }

        if (req.app.get('io')) {
          req.app.get('io').emit('priceDropped', {
            ...product,
            old_price: oldPrice,
            price_drop: oldPrice - newPrice,
            drop_percentage: ((oldPrice - newPrice) / oldPrice * 100).toFixed(1)
          });
        }
      }
    }

    res.json({
      status: 'success',
      message: 'Price updated successfully',
      data: productDetails[0] || null
    });
  } catch (err) {
    console.error("❌ DB error:", err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get("/details/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    const db = await getConnection();

    const [productRows] = await db.query(
      "SELECT * FROM products WHERE product_id = ?",
      [productId]
    );

    if (productRows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = productRows[0];

    const [priceRows] = await db.query(`
      SELECT 
        p.price_id,
        p.price,
        p.on_deal,
        p.location_id,
        sl.location_name,
        s.supermarket_name,
        s.image_path AS supermarket_image
      FROM prices p
      JOIN supermarket_locations sl ON p.location_id = sl.location_id
      JOIN supermarkets s ON sl.supermarket_id = s.supermarket_id
      WHERE p.product_id = ?
      ORDER BY p.price ASC
    `, [productId]);

    res.json({
      product: {
        ...product,
        prices: priceRows
      }
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/', authenticateToken, upload.single('productImage'), async (req, res) => {
  try {
    const db = await getConnection();
    const { productName, productPrice, categoryId } = req.body;
    const locationId = req.user.location_id;

    if (!productName || !productPrice || !req.file || !categoryId) {
      return res.status(400).json({ error: 'Product name, price, image, and category are required' });
    }

    const price = parseFloat(productPrice);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'Invalid price value' });
    }

    const [locationRows] = await db.query(
      'SELECT country FROM supermarket_locations WHERE location_id = ?',
      [locationId]
    );

  if (!locationRows.length) {
      return res.status(400).json({ error: 'Supermarket location not found' });
    }

    const ownerCountry = locationRows[0].country;

      await db.query('START TRANSACTION');
      try {

      const [productResult] = await db.query(
        'INSERT INTO products (product_name, image_path, category_id, country) VALUES (?, ?, ?, ?)',
        [productName, `images/${req.file.filename}`, categoryId, ownerCountry]
      );

      const productId = productResult.insertId;

      await db.query(
        'INSERT INTO prices (product_id, location_id, price, last_updated) VALUES (?, ?, ?, NOW())',
        [productId, locationId, price]
      );

      await db.query('COMMIT');

      const [newProduct] = await db.query(
        `SELECT p.*, pr.price, pr.location_id, c.category_name 
         FROM products p
         JOIN prices pr ON p.product_id = pr.product_id
         JOIN categories c ON p.category_id = c.category_id
         WHERE p.product_id = ? AND pr.location_id = ?`,
        [productId, locationId]
      );

      res.status(201).json({
        message: 'Product created successfully',
        product: newProduct[0],
      });

    } catch (error) {

      await db.query('ROLLBACK');

      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      throw error;
    }
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.get('/', async (req, res) => {
  try {
    const db = await getConnection();
    const [products] = await db.query('SELECT * FROM products');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/details/:id', async (req, res) => {
  try {
    const [product] = await db.query('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
    if (product.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product: product[0] });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getConnection();
    const { id } = req.params;
    const locationId = req.user.location_id;

    await db.query('START TRANSACTION');

    try {

      const [existingPrice] = await db.query(
        'SELECT * FROM prices WHERE product_id = ? AND location_id = ?',
        [id, locationId]
      );

      if (!existingPrice.length) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Product not found in this location' });
      }

      await db.query(`
        DELETE f FROM favorites f
        JOIN prices p ON f.price_id = p.price_id
        WHERE f.product_id = ? AND p.location_id = ?
      `, [id, locationId]);

      await db.query('DELETE FROM deals WHERE product_id = ? AND location_id = ?', [id, locationId]);

      const [result] = await db.query(
        'DELETE FROM prices WHERE product_id = ? AND location_id = ?',
        [id, locationId]
      );

      if (result.affectedRows === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Product not found in this location' });
      }

      await db.query('COMMIT');

      req.app.get('io')?.emit('productDeleted', {
        productId: parseInt(id),
        locationId: parseInt(locationId)
      });

      res.json({
        status: 'success',
        message: 'Product removed from this location successfully'
      });
    } catch (error) {

      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error removing product from location:', error);
    res.status(500).json({ error: 'Failed to remove product from location' });
  }
});

module.exports = router;
