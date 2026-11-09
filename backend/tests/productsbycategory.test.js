const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const router = require('../routes/productsbycategory');
const db = require('../db');

jest.mock('../db');

describe('GET /api/productsbycategory/:categoryId', () => {
  let app;
  let token;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/productsbycategory', router);
    token = jwt.sign(
      { userId: 1, role: 'customer', country: 'Hungary' },
      process.env.JWT_SECRET_KEY || 'defaultSecretKey'
    );
  });

  it('should return products for a given category', async () => {
    const mockCategory = [
      {
        category_id: 1,
        category_name: 'Electronics',
      },
    ];

    const mockProducts = [
      { product_id: 1, product_name: 'Biscuit', image_path: '/images/biscuit.jpg' },
      { product_id: 2, product_name: 'Cake', image_path: '/images/cake.jpg' },
    ];

    db.query.mockResolvedValueOnce([mockCategory])
      .mockResolvedValueOnce([mockProducts]);

    const response = await request(app)
      .get('/api/productsbycategory/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.category_name).toBe('Electronics');
    expect(response.body.products.length).toBe(2);
    expect(response.body.products[0].product_name).toBe('Biscuit');
    expect(response.body.products[1].product_name).toBe('Cake');
  });

  it('should return 404 if the category is not found', async () => {
    db.query.mockResolvedValueOnce([[]]);

    const response = await request(app)
      .get('/api/productsbycategory/999')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Category not found');
  });

  it('should return 500 if there is a database error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    db.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .get('/api/productsbycategory/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Server error');

    consoleSpy.mockRestore();
  });
});
