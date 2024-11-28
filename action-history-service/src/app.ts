import Fastify from 'fastify';
import routes from './routes/actions';

const app = Fastify();

app.register(routes);

export default app;
