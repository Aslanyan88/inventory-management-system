import { FastifyReply, FastifyRequest } from 'fastify';
import pool from '../db';

export const logAction = async (request: FastifyRequest, reply: FastifyReply) => {
  const { shop_id, plu, action, date } = request.body as any;

  if (!plu || !action) {
    return reply.status(400).send({ error: 'plu and action are required fields' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO actions (shop_id, plu, action, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [shop_id, plu, action, date || new Date()]
    );
    reply.send(result.rows[0]);
  } catch (err) {
    console.error('Error logging action:', err);
    reply.status(500).send({ error: 'Failed to log action' });
  }
};

export const getActions = async (request: FastifyRequest, reply: FastifyReply) => {
  const {
    shop_id,
    plu,
    date_start,
    date_end,
    action,
    page = 1,
    limit = 10,
  } = request.query as any;

  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM actions WHERE 1=1';
  const params = [];

  if (shop_id) {
    params.push(shop_id);
    query += ` AND shop_id = $${params.length}`;
  }
  if (plu) {
    params.push(plu);
    query += ` AND plu = $${params.length}`;
  }
  if (date_start) {
    params.push(date_start);
    query += ` AND date >= $${params.length}`;
  }
  if (date_end) {
    params.push(date_end);
    query += ` AND date <= $${params.length}`;
  }
  if (action) {
    params.push(action);
    query += ` AND action = $${params.length}`;
  }

  query += ` ORDER BY date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  try {
    const result = await pool.query(query, params);
    reply.send(result.rows);
  } catch (err) {
    console.error('Error fetching actions:', err);
    reply.status(500).send({ error: 'Failed to fetch actions' });
  }
};
