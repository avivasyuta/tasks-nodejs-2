const mongoose = require('mongoose');
const connection = require('../libs/connection');

const orderSchema = new mongoose.Schema({
  user: {
    /* TODO */
  },
  products: {},
  phone: {
    /* TODO */
  },
  address: {
    /* TODO */
  },
});

module.exports = connection.model('Order', orderSchema);
