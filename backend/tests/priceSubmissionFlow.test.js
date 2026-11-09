const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const priceSubmissions = require('../routes/priceSubmissions');
const db = require('../db');

jest.mock('../db');

describe('price submission flow', () => {
  let app;
  let emit;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/price-submissions', priceSubmissions.router);
    emit = jest.fn();
    priceSubmissions.initializeSocket({ to: jest.fn(() => ({ emit })) });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates the evidence directory and stores an uploaded receipt', async () => {
    const token = jwt.sign(
      { userId: 7, role: 'customer' },
      process.env.JWT_SECRET_KEY || 'defaultSecretKey'
    );
    const submission = {
      submission_id: 99,
      customer_id: 7,
      product_id: 1,
      location_id: 2,
      new_price: '80.00',
      status: 'pending',
      product_name: 'Milk',
      customer_name: 'Ava',
    };

    db.query
      .mockResolvedValueOnce([{ insertId: 99 }])
      .mockResolvedValueOnce([[submission]])
      .mockResolvedValueOnce([[{ product_name: 'Milk' }]])
      .mockResolvedValueOnce([[{ username: 'Ava' }]]);

    const response = await request(app)
      .post('/api/price-submissions')
      .set('Authorization', `Bearer ${token}`)
      .field('product_id', '1')
      .field('location_id', '2')
      .field('new_price', '80')
      .attach('evidence_image', Buffer.from('receipt'), {
        filename: 'receipt.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(201);

    const insertParams = db.query.mock.calls[0][1];
    const storedPath = insertParams[5];
    const absolutePath = path.join(__dirname, '..', storedPath);

    try {
      expect(storedPath).toMatch(/^uploads\/evidence\//);
      expect(fs.existsSync(absolutePath)).toBe(true);
    } finally {
      fs.rmSync(absolutePath, { force: true });
    }
  });

  it('approves a submission, updates the price, and notifies the customer', async () => {
    const token = jwt.sign(
      { userId: 1, role: 'owner' },
      process.env.JWT_SECRET_KEY || 'defaultSecretKey'
    );

    db.query
      .mockResolvedValueOnce([
        [{
          submission_id: 5,
          product_id: 10,
          location_id: 2,
          customer_id: 7,
          new_price: '75.50',
        }],
      ])
      .mockResolvedValueOnce([[{ user_id: 1, location_id: 2 }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    const response = await request(app)
      .put('/api/price-submissions/approve/5')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(db.query).toHaveBeenCalledWith(
      'UPDATE prices SET price = ? WHERE product_id = ? AND location_id = ?',
      ['75.50', 10, 2]
    );
    expect(emit).toHaveBeenCalledWith(
      'priceSubmissionApproved',
      expect.objectContaining({ message: expect.stringContaining('approved') })
    );
  });

  it('rejects approval from an owner of another location', async () => {
    const token = jwt.sign(
      { userId: 1, role: 'owner' },
      process.env.JWT_SECRET_KEY || 'defaultSecretKey'
    );

    db.query
      .mockResolvedValueOnce([
        [{
          submission_id: 5,
          product_id: 10,
          location_id: 2,
          customer_id: 7,
          new_price: '75.50',
        }],
      ])
      .mockResolvedValueOnce([[]]);

    const response = await request(app)
      .put('/api/price-submissions/approve/5')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Not authorized');
  });
});
