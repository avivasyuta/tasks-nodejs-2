const Product = require('../models/Product');

module.exports = async function search(ctx, next) {
  const products = await Product.find({
    $text: {$search: ctx.query.q},
  });
  ctx.body = {products};
};
