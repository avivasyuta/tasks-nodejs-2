const mongoose = require('mongoose');
const connection = require('../libs/connection');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  product: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  phone: {
    type: String,
    required: true,
    match: /\+?\d{6,14}/,
  },
  address: {
    type: String,
    required: true,
  },
});

module.exports = connection.model('Order', orderSchema);
