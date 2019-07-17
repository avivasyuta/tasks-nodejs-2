const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const uuid = require('uuid/v4');
const Router = require('koa-router');
const cors = require('@koa/cors');
const handleMongooseValidationError = require('./libs/validationErrors');
const Session = require('./models/Session');
const mustBeAuthenticated = require('./libs/mustBeAuthenticated');
const orders = require('./controllers/orders');
const registration = require('./controllers/registration');

const app = new Koa();

app.use(cors());
app.use(require('koa-bodyparser')());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (err.status) {
      ctx.status = err.status;
      ctx.body = {error: err.message};
    } else {
      console.error(err);
      ctx.status = 500;
      ctx.body = {error: 'Internal server error'};
    }
  }
});

app.use((ctx, next) => {
  ctx.login = async function login(user) {
    const token = uuid();
    await Session.create({token, user, lastVisit: new Date()});

    return token;
  };

  return next();
});

const router = new Router({prefix: '/api'});

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

// auth
router.post('/login', require('./controllers/login'));
router.get('/oauth/:provider', require('./controllers/oauth').oauth);
router.post('/oauth_callback', handleMongooseValidationError,
    require('./controllers/oauth').oauthCallback);
router.post('/register', handleMongooseValidationError, registration.register);
router.post('/confirm', registration.confirm);

// shop
router.get('/categories', require('./controllers/categories'));
router.get('/products', require('./controllers/products').list);
router.get('/products/:id', require('./controllers/products').show);
router.get('/recommendations', require('./controllers/recommendations'));
router.get('/orders', /* TODO */ orders.list);
router.post('/orders', /* TODO */ orders.checkout);

// search
router.get('/search', require('./controllers/search'));

// protected
router.get('/me', mustBeAuthenticated, require('./controllers/me'));
router.get('/messages', mustBeAuthenticated, require('./controllers/messages'));

app.use(router.routes());

module.exports = app;
