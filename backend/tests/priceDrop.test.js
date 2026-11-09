const request = require('supertest');
const express = require('express');
const router = require('../routes/products');
const db = require('../db');
const { createPriceChangeAlert } = require('../routes/alerts');

jest.mock('../db');
jest.mock('../routes/alerts', () => ({
  createPriceChangeAlert: jest.fn(),
}));

describe('PUT /api/products/:id price drop detection', () => {
  let app;
  let io;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/products', router);
    io = { emit: jest.fn() };
    app.set('io', io);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates one alert per favorite user when the price drops', async () => {
    db.query
      .mockResolvedValueOnce([[{ price: '100.00' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([
        [{
          product_id: 1,
          product_name: 'Milk (1 liter)',
          price: '80.00',
          on_deal: 0,
          location_name: 'Downtown',
          supermarket_name: 'Aldi',
          location_id: 2,
        }],
      ])
      .mockResolvedValueOnce([[{ user_id: 7 }, { user_id: 8 }]]);

    const response = await request(app)
      .put('/api/products/1')
      .send({ price: 80, locationId: 2 });

    expect(response.status).toBe(200);
    expect(createPriceChangeAlert).toHaveBeenCalledTimes(2);
    expect(createPriceChangeAlert).toHaveBeenNthCalledWith(
      1,
      7,
      'customer',
      '1',
      2,
      100,
      80,
      expect.stringContaining('price dropped')
    );
    expect(createPriceChangeAlert).toHaveBeenNthCalledWith(
      2,
      8,
      'customer',
      '1',
      2,
      100,
      80,
      expect.stringContaining('price dropped')
    );
    expect(io.emit).toHaveBeenCalledWith(
      'priceUpdated',
      expect.objectContaining({ product_id: 1 })
    );
    expect(io.emit).toHaveBeenCalledWith(
      'priceDropped',
      expect.objectContaining({ old_price: 100, price_drop: 20 })
    );
  });

  it('does not create alerts when the price increases', async () => {
    db.query
      .mockResolvedValueOnce([[{ price: '100.00' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([
        [{
          product_id: 1,
          product_name: 'Milk (1 liter)',
          price: '120.00',
          on_deal: 0,
          location_name: 'Downtown',
          supermarket_name: 'Aldi',
          location_id: 2,
        }],
      ]);

    const response = await request(app)
      .put('/api/products/1')
      .send({ price: 120, locationId: 2 });

    expect(response.status).toBe(200);
    expect(createPriceChangeAlert).not.toHaveBeenCalled();
    expect(io.emit).toHaveBeenCalledWith('priceUpdated', expect.any(Object));
    expect(io.emit).not.toHaveBeenCalledWith('priceDropped', expect.any(Object));
  });

  it('does not create alerts when the price is unchanged', async () => {
    db.query
      .mockResolvedValueOnce([[{ price: '100.00' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([
        [{
          product_id: 1,
          product_name: 'Milk (1 liter)',
          price: '100.00',
          on_deal: 0,
          location_name: 'Downtown',
          supermarket_name: 'Aldi',
          location_id: 2,
        }],
      ]);

    const response = await request(app)
      .put('/api/products/1')
      .send({ price: 100, locationId: 2 });

    expect(response.status).toBe(200);
    expect(createPriceChangeAlert).not.toHaveBeenCalled();
  });

  it('returns 404 when the price entry does not exist', async () => {
    db.query.mockResolvedValueOnce([[]]);

    const response = await request(app)
      .put('/api/products/999')
      .send({ price: 50, locationId: 2 });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Price entry not found');
    expect(createPriceChangeAlert).not.toHaveBeenCalled();
  });
});
