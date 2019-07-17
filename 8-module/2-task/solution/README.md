# Создание заказов (решение)

## Создание модели Order

Для начала необходимо создать саму модель заказа, где должно быть указано перечень продуктов, текущий пользователь, 
адрес и телефон.

После описания всех необходимых полей схема должна выглядеть следующим образом

```js
// ./models/Order.js

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  }],
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
});
```

## Создание заказа

Тут нам необходимо просто необходимо взять тело запроса и на основании него создать заказ, сохранив его в базу.
Единственный ньюанс заключается в том, что id пользователя нужно брать из контекста, а не из запроса 
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

Тут все достаточно просто - нам необходимо получить из базы данных все заказы текущего пользователя.
Для удобства отображения заказов лучше сразу вернуть и описание заказанных продуктов, иначе клиенту 
придется делать дополнительные запросы для получения информации о заказанных продуктах

```js
// ./controllers/orders.js

module.exports.list = async function ordersList(ctx, next) {
  ctx.body = await Order.find({user: ctx.user.id}).populate('products');
};
```

## Подключение обработчиков к роутеру

И последним шагом необходимо уже готовые обработчики подключить к роутеру.
При этом надо не забыть добавить необходимые middleware:
* `mustBeAuthenticated` - для проверки авторизирован ли пользователь
* `handleMongooseValidationError` - для обработки ошибок валидации

```js
// ./app.js

router.get('/orders', mustBeAuthenticated, handleMongooseValidationError, orders.list);
router.post('/orders', mustBeAuthenticated, handleMongooseValidationError, orders.checkout);
```
