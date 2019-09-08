# Создание заказов (решение)

## Создание модели Order

Для начала необходимо создать саму модель заказа, где должны быть указаны заказанный продукт, 
текущий пользователь, адрес и телефон.

Для валидации телефонного номера в данном случае удобнее всего использовать кастомный валидатор, в
котором объявить функцию проверки номера, а также сообщение, которое необходимо вернуть 
пользователю.

После описания всех необходимых полей схема должна выглядеть следующим образом

```js
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  phone: {
    type: String,
    required: true,
    validate: [
      {
        validator(value) {
          return /\+?\d{6,14}/.test(value);
        },
        message: 'Неверный формат номера телефона.',
      },
    ],
  },
  address: {
    type: String,
    required: true,
  },
}); 
```

## Создание заказа

Единственный нюанс в создании модели заказа и сохранении её в базу заключается в том, что id 
пользователя нужно брать из объекта `ctx.user`, а не из тела запроса. В ответ нам надо вернуть 
id только что созданного заказа.

Обработчик создания заказа может в итоге выглядеть следующим образом:

```js
module.exports.checkout = async function checkout(ctx, next) {
  const order = await Order.create({
    product: ctx.request.body.product,
    phone: ctx.request.body.phone,
    address: ctx.request.body.address,
    
    // обратите внимание, что тут пользователь берется из ctx.user 
    user: ctx.user,
  });

  ctx.body = {order: order.id};
};
```

## Получение списка заказов

Задачу получениия списка заказов удобнее разбить на 2 небольших подзадачи:
1. Собственно получение списка заказов из базы данных
2. Преобразование документов для отдачи пользователю

Решение первой подзадачи достаточно прямолинейно:
```js
const mapOrder = require('../mappers/order');

module.exports.getOrdersList = async function ordersList(ctx, next) {
  const orders = await Order.find({user: ctx.user}).populate('product');
  ctx.body = {orders: orders.map(mapOrder)};
};
```

Решение второй подзадачи заключается в реализации функции `mapOrder`, которая может выглядеть 
подобным образом:
```js
const mapProduct = require('./product');

module.exports = function mapOrder(order) {
  return {
    id: order.id,
    user: order.user,
    product: mapProduct(order.product),
    phone: order.phone,
    address: order.address,
  };
};
```

## Подключение обработчиков к роутеру

И последним шагом необходимо уже готовые обработчики подключить к роутеру. При этом надо не забыть 
добавить необходимые middleware:
* `mustBeAuthenticated` - для проверки авторизирован ли пользователь
* `handleMongooseValidationError` - для обработки ошибок валидации

```js
router.get('/orders', mustBeAuthenticated, getOrdersList);
router.post('/orders', mustBeAuthenticated, handleMongooseValidationError, checkout);
```
