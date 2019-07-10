const Koa = require('koa');
const uuid = require('uuid/v4');
const Router = require('koa-router');
const handleMongooseValidationError = require('./libs/validationErrors');
const Session = require('./models/Session');
const mustBeAuthenticated = require('./libs/mustBeAuthenticated');

const app = new Koa();

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

    return token;
  };

  return next();
});

const router = new Router({prefix: '/api'});

router.use(async (ctx, next) => {
  const header = ctx.request.get('Authorization');
  if (!header) return next();

  return next();
});

router.post('/login', require('./controllers/login'));
router.get('/oauth/:provider', require('./controllers/oauth').oauth);
router.post('/oauth_callback', handleMongooseValidationError, require('./controllers/oauth').oauthCallback);
router.post('/register', handleMongooseValidationError, require('./controllers/register'));
router.post('/confirm', require('./controllers/confirm'));

router.get('/me', require('./controllers/me'));

app.use(router.routes());

module.exports = app;
