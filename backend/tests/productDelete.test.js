const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const router = require('../routes/products');
const db = require('../db');

jest.mock('../db');

describe('DELETE /api/products/:id', () => {
  let app;
  let io;
  let token;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/products', router);
    io = { emit: jest.fn() };
    app.set('io', io);
    token = jwt.sign(
      { userId: 1, role: 'owner' },
      process.env.JWT_SECRET_KEY || 'defaultSecretKey'
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('removes the product from the owner location and emits productDeleted', async () => {
    db.query
      .mockResolvedValueOnce([[{ location_id: 2 }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([[{ price_id: 10, product_id: 1, location_id: 2 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{}]);

    const response = await request(app)
      .delete('/api/products/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Product removed from this location successfully');
    expect(db.query).toHaveBeenCalledWith(
      'DELETE FROM prices WHERE product_id = ? AND location_id = ?',
      ['1', 2]
    );
    expect(io.emit).toHaveBeenCalledWith('productDeleted', {
      productId: 1,
      locationId: 2,
    });
  });

  it('returns 404 when the product is not in the owner location', async () => {
    db.query
      .mockResolvedValueOnce([[{ location_id: 2 }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{}]);

    const response = await request(app)
      .delete('/api/products/999')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Product not found in this location');
    expect(io.emit).not.toHaveBeenCalled();
  });

  it('requires a token', async () => {
    const response = await request(app).delete('/api/products/1');

    expect(response.status).toBe(401);
  });
});
