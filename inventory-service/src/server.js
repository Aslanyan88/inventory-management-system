const app = require('./app');
const pool = require('./db');
const PORT = process.env.PORT || 3000;
(async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('Connected to the database successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to the database:', err);
  }
})();
