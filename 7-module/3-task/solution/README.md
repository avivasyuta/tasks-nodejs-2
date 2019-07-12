# Работа с пользователем, сессии (Решение)


## Сессии

Создание документа можно выполнить с помощью функции `.create`, важно помнить, что при создании
сессии мы должны указать для какого пользователя она создаётся (записать в поле `user` 
идентификатор пользователя), а также время создания сессии (поле `lastVisit`). Получившийся код 
может выглядеть следующим образом:
```js
app.use((ctx, next) => {
  ctx.login = async function login(user) {
    const token = uuid();
    await Session.create({ token, user, lastVisit: new Date() });
    
    return token;
  };
  
  return next();
});
```
Обратите внимание, необязательно в качестве значения для свойства `user` передавать идентификатор -
если передать целиком объект пользователь `mongoose` самостоятельно получит из него значение поля 
`.id`.


## Проверка сессионного токена

Эту задачу удобнее всего выполнять по пунктам условия:
1. Первым делом попытаемся из переменной `header` получить значение токена. Если токена нет - 
игнорируем заголовок и вызываем цепочку обработки запроса дальше.
```js
  const token = header.split(' ')[1];
  if (!token) return next();
```
2. По полученному токену находим сессию пользователя вместе с объектом самого пользователя. Дело в 
том, что при дальнейшей обработке запроса эта информация может быть очень полезной. Если же сессии в
базе данных нет - то мы должны сообщить пользователю, что его токен не является валидным. Такое 
может произойти, если пользователь логинился давно и его сессия уже была удалена или если 
злоумышленник пытается подделать чей-то сессионный ключ. 
```js
  const session = await Session.findOne({token}).populate('user');
  if (!session) {
    ctx.throw(401, 'Неверный аутентификационный токен');
  }
```
3. Следуя условиям задачи для найденной сессии нам необходимо обновить значение поля `lastVisit`,
обеспечив таким образом длительность жизни сессии еще на 7 дней. Кроме этого конечно запишем объект
пользователя в свойство `ctx.user`. Если мы соберем все части вместе у нас получится следующий код:
```js
router.use(async (ctx, next) => {
  const header = ctx.request.get('Authorization');
  if (!header) return next();

  const token = header.split(' ')[1];
  if (!token) return next();

  const session = await Session.findOne({token}).populate('user');
  if (!session) {
    ctx.throw(401, 'Неверный аутентификационный токен');
  }
  session.lastVisit = new Date();
  await session.save();

  ctx.user = session.user;
  return next();
});
```


## Защищенные ресурсы

Сама по себе функция `mustBeAuthenticated` становится очень и очень простой, поскольку все 
подготовительные действия уже были выполнены на предыдущем шаге. Нам достаточно проверить наличие
свойства `ctx.user` и продолжить обработку запроса. Если же свойства нет - значит пользователь не 
предоставил сессионный токен, а значит он не является залогиненным, в этом случае нам нужно вернуть
ошибку:
```js
module.exports = function mustBeAuthenticated(ctx, next) {
  if (!ctx.user) {
    ctx.throw(401, 'Пользователь не залогинен');
  }
  
  return next();
};
```

Включение этой функции в цепочку обработки тоже достаточно тривиально: `koa-router` позволяет нам 
формировать цепочку обработки конкретного запроса, перечисляя middleware через запятую. Таким 
образом, у нас получится следующий код:
```js
router.get('/me', mustBeAuthenticated, require('./controllers/me'));
``` 