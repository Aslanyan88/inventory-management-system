const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stocks');

router.post('/', stockController.createStock);
router.patch('/increase/:id', stockController.increaseStock);
router.patch('/decrease/:id', stockController.decreaseStock);
router.get('/', stockController.getStocks);

module.exports = router;
