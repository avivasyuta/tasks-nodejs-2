const mongoose = require('mongoose');
const connection = require('../libs/connection');

const orderSchema = new mongoose.Schema({
  user: {
    /* TODO */
  },
  product: {
    /* TODO */
  },
  phone: {
    /* TODO */
  },
  address: {
    /* TODO */
  },
});

module.exports = connection.model('Order', orderSchema);
