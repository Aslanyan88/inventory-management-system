const express = require('express');
const bodyParser = require('body-parser');
const productRoutes = require('./routes/products');
const stockRoutes = require('./routes/stocks');
const app = express();

app.use(bodyParser.json()); 

app.use('/products', productRoutes);
app.use('/stocks', stockRoutes);

module.exports = app;
