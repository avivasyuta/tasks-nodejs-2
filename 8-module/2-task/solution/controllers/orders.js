const Order = require('../models/Order');

module.exports.checkout = async function checkout(ctx, next) {
  const order = await Order.create({
    user: ctx.user,
    products: ctx.request.body.products,
    phone: ctx.request.body.phone,
    address: ctx.request.body.address,
  });

  ctx.body = {order: order.id};
};

module.exports.list = async function ordersList(ctx, next) {
  ctx.body = await Order.find({user: ctx.user.id}).populate('products');
};
