# Создание заказов (решение)

## Создание модели Order

Для начала необходимо создать саму модель заказа, где должны быть указаны заказанный продукт, текущий пользователь, 
адрес и телефон.
Для проверки телефона воспользуемся свойством `match`, где с помощью регулярного выражения описать строку, 
которая будет соответствовать требованиям. Регулярное выражение должно выглядеть следующим образом - `/^\+?\d{6,14}$/`.
В случае, если переданная в поле phone строка не будет соответствовать указанному регулярному выражению - при сохранении 
будет выбрасываться ошибка валидации.

После описания всех необходимых полей схема должна выглядеть следующим образом

```js
// ./models/Order.js

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
    match: /\+?\d{6,14}/,
  },
  address: {
    type: String,
    required: true,
  },
});
```

## Создание заказа

Для создания заказа необходимо взять тело запроса и на основании него создать заказ, сохранив его в базу.
Единственный нюанс заключается в том, что id пользователя нужно брать из контекста, а не из запроса 
(иначе можно будет создать заказ любому пользователю, даже несуществующему)

В ответ нам надо вернуть id только что созданного заказа;

Обработчик создания заказа должен в итоге выглядеть следующим образом:

```js
// ./controllers/orders.js

module.exports.checkout = async function checkout(ctx, next) {
  const order = await Order.create({
  
    products: ctx.request.body.products,
    phone: ctx.request.body.phone,
    address: ctx.request.body.address,
    
    // обратите внимание, что тут пользователь берется из конекста запроса 
    // а не из тела запроса 
    user: ctx.user,
  });

  ctx.body = {order: order.id};
};
```

## Получение списка заказов

Тут необходимо получить из базы данных все заказы текущего пользователя.
Для удобства отображения заказов лучше сразу вернуть и описание заказанного продукта, иначе клиенту 
придется делать дополнительные запросы для получения дополнительной информации о заказе.

Тут мы снова будем использовать специальную функцию, которая будет преобразовывать модель в нужный формат ответа.

Функция преобразования будет выглядеть слудющим образом:
```js
// ./mappers/order.js

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

Сам же контроллер:
```js
// ./controllers/orders.js

module.exports.getOrdersList = async function ordersList(ctx, next) {
  const order = await Order.find({user: ctx.user.id}).populate('product');
  ctx.body = order.map(mapOrder);
};
```

## Подключение обработчиков к роутеру

И последним шагом необходимо уже готовые обработчики подключить к роутеру.
При этом надо не забыть добавить необходимые middleware:
* `mustBeAuthenticated` - для проверки авторизирован ли пользователь
* `handleMongooseValidationError` - для обработки ошибок валидации

```js
// ./app.js
const {getOrdersList, checkout} = require('./controllers/orders');

// ...

router.get('/orders', mustBeAuthenticated, getOrdersList);
router.post('/orders', mustBeAuthenticated, handleMongooseValidationError, checkout);
```
