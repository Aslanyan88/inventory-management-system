import app from './app';

const PORT = Number(process.env.PORT) || 4000;

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
  console.log(`Action History Service running at ${address}`);
});
