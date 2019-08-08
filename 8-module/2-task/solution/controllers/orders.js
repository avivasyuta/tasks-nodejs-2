const Order = require('../models/Order');
const mapOrder = require('../mappers/order');
const sendMail = require('../libs/sendMail');

module.exports.checkout = async function checkout(ctx, next) {
  const order = await Order.create({
    user: ctx.user,
    product: ctx.request.body.product,
    phone: ctx.request.body.phone,
    address: ctx.request.body.address,
  });

  await order.populate('product').execPopulate();

  await sendMail({
    template: 'order-confirmation',
    locals: order,
    to: ctx.user.email,
    subject: 'Подтверждение создания заказа',
  });

  ctx.body = {order: order.id};
};

module.exports.getOrdersList = async function ordersList(ctx, next) {
  const orders = await Order.find({user: ctx.user}).populate('product');
  ctx.body = {orders: orders.map(mapOrder)};
};
