import { FastifyInstance } from 'fastify';
import { logAction, getActions } from '../controllers/actions';

export default async function (app: FastifyInstance) {
  app.post('/actions', logAction);
  app.get('/actions', getActions);
}
