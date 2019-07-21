const Order = require('../models/Order');
const mapOrder = require('../mappers/order');

module.exports.checkout = async function checkout(ctx, next) {
  const order = await Order.create({
    user: ctx.user,
    product: ctx.request.body.product,
    phone: ctx.request.body.phone,
    address: ctx.request.body.address,
  });

  ctx.body = {order: order.id};
};

module.exports.getOrdersList = async function ordersList(ctx, next) {
  const order = await Order.find({user: ctx.user.id}).populate('product');
  ctx.body = order.map(mapOrder);
};
