const pool = require('../db');
const axios = require('axios');

exports.createProduct = async (req, res) => {
  const { plu, name } = req.body;

  if (!plu || !name) {
    return res.status(400).json({ error: 'plu and name are required fields' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO products (plu, name) VALUES ($1, $2) RETURNING *',
      [plu, name]
    );

    await axios.post('http://localhost:4000/actions', {
      shop_id: null,
      plu: plu,
      action: 'create_product',
      date: new Date(),
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.getProducts = async (req, res) => {
  const { name, plu } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (name) {
    params.push(`%${name}%`);
    query += ` AND name ILIKE $${params.length}`;
  }
  if (plu) {
    params.push(plu);
    query += ` AND plu = $${params.length}`;
  }

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};
