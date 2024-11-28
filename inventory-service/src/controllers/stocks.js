const pool = require('../db');
const axios = require('axios');

exports.createStock = async (req, res) => {
  const { product_id, shop_id, quantity_on_shelf, quantity_in_order } = req.body;

  if (!product_id || !shop_id) {
    return res.status(400).json({ error: 'product_id and shop_id are required fields' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO stocks (product_id, shop_id, quantity_on_shelf, quantity_in_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [product_id, shop_id, quantity_on_shelf || 0, quantity_in_order || 0]
    );

    const productResult = await pool.query('SELECT plu FROM products WHERE id = $1', [product_id]);
    const plu = productResult.rows[0].plu;

    await axios.post('http://localhost:4000/actions', {
      shop_id: shop_id,
      plu: plu,
      action: 'create_stock',
      date: new Date(),
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating stock:', err);
    res.status(500).json({ error: 'Failed to create stock' });
  }
};

exports.increaseStock = async (req, res) => {
  const stockId = req.params.id;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });
  }

  try {
    const result = await pool.query(
      'UPDATE stocks SET quantity_on_shelf = quantity_on_shelf + $1 WHERE id = $2 RETURNING *',
      [quantity, stockId]
    );

    const stock = result.rows[0];

    if (!stock) {
      return res.status(404).json({ error: 'Stock entry not found' });
    }

    const productResult = await pool.query('SELECT plu FROM products WHERE id = $1', [stock.product_id]);
    const plu = productResult.rows[0].plu;

    await axios.post('http://localhost:4000/actions', {
      shop_id: stock.shop_id,
      plu: plu,
      action: 'increase_stock',
      date: new Date(),
    });

    res.json(stock);
  } catch (err) {
    console.error('Error increasing stock:', err);
    res.status(500).json({ error: 'Failed to increase stock' });
  }
};

exports.decreaseStock = async (req, res) => {
  const stockId = req.params.id;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });
  }

  try {
    const currentStockResult = await pool.query('SELECT quantity_on_shelf FROM stocks WHERE id = $1', [stockId]);
    const currentStock = currentStockResult.rows[0];

    if (!currentStock) {
      return res.status(404).json({ error: 'Stock entry not found' });
    }

    if (currentStock.quantity_on_shelf < quantity) {
      return res.status(400).json({ error: 'Insufficient stock to decrease' });
    }

    const result = await pool.query(
      'UPDATE stocks SET quantity_on_shelf = quantity_on_shelf - $1 WHERE id = $2 RETURNING *',
      [quantity, stockId]
    );

    const stock = result.rows[0];

    const productResult = await pool.query('SELECT plu FROM products WHERE id = $1', [stock.product_id]);
    const plu = productResult.rows[0].plu;

    await axios.post('http://localhost:4000/actions', {
      shop_id: stock.shop_id,
      plu: plu,
      action: 'decrease_stock',
      date: new Date(),
    });

    res.json(stock);
  } catch (err) {
    console.error('Error decreasing stock:', err);
    res.status(500).json({ error: 'Failed to decrease stock' });
  }
};

exports.getStocks = async (req, res) => {
  const {
    plu,
    shop_id,
    quantity_on_shelf_min,
    quantity_on_shelf_max,
    quantity_in_order_min,
    quantity_in_order_max,
  } = req.query;

  let query = `
    SELECT stocks.*, products.plu, products.name
    FROM stocks
    JOIN products ON stocks.product_id = products.id
    WHERE 1=1
  `;
  const params = [];

  if (plu) {
    params.push(plu);
    query += ` AND products.plu = $${params.length}`;
  }
  if (shop_id) {
    params.push(shop_id);
    query += ` AND stocks.shop_id = $${params.length}`;
  }
  if (quantity_on_shelf_min) {
    params.push(quantity_on_shelf_min);
    query += ` AND stocks.quantity_on_shelf >= $${params.length}`;
  }
  if (quantity_on_shelf_max) {
    params.push(quantity_on_shelf_max);
    query += ` AND stocks.quantity_on_shelf <= $${params.length}`;
  }
  if (quantity_in_order_min) {
    params.push(quantity_in_order_min);
    query += ` AND stocks.quantity_in_order >= $${params.length}`;
  }
  if (quantity_in_order_max) {
    params.push(quantity_in_order_max);
    query += ` AND stocks.quantity_in_order <= $${params.length}`;
  }

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching stocks:', err);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
};
