const app = require('../app');
const mongoose = require('mongoose');
const connection = require('../libs/connection');

const request = require('request-promise').defaults({
  resolveWithFullResponse: true,
  simple: false,
  json: true,
});

const Order = require('./../models/Order');
const User = require('./../models/User');
const Session = require('./../models/Session');
const Category = require('./../models/Category');
const Product = require('./../models/Product');

const ObjectId = mongoose.Schema.Types.ObjectId;
const createObjectId = mongoose.Types.ObjectId;
const isObjectId = (id) => {
  try {
    createObjectId(id);
    return true;
  } catch (e) {
    return false;
  }
};

const expect = require('chai').expect;

async function createUserAndSession(userData, token) {
  const user = new User(userData);
  await user.setPassword(userData.password);
  await user.save();
  await Session.create({token, user, lastVisit: new Date()});
  return user;
}

async function cleanUpDB() {
  await Order.deleteMany({});
  await User.deleteMany({});
  await Session.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
}

describe('8-module-2-task', () => {
  let server;
  const port = 3000;
  const serverURL = `http://localhost:${port}/api/orders`;

  after(() => {
    connection.close();
  });

  describe('модель заказа', () => {
    it('должна содержать обязательное свойство `user`', () => {
      const userField = Order.schema.obj.user;

      expect(userField, 'у модели есть свойство user').to.be.not.undefined;
      expect(userField.required, 'свойство user является обязательным').to.be.true;
      expect(userField.type, 'тип свойства user - ObjectId').to.be.equal(ObjectId);
      expect(userField.ref, 'свойство user ссылается на модель `User`').to.be.equal('User');
    });

    it('должна содержать обязательное свойство `products`', () => {
      const productsField = Order.schema.obj.products;

      expect(productsField, 'у модели есть свойство products').to.be.not.undefined;
      expect(productsField, 'свойство products является массивом').to.be.a('array');
      expect(productsField[0].required, 'свойство products является обязательным').to.be.true;
      expect(productsField[0].type, 'тип свойства products - ObjectId').to.be.equal(ObjectId);
      expect(productsField[0].ref, 'свойство products ссылается на модель `Product`')
          .to.be.equal('Product');
    });

    it('должна содержать обязательное свойство `address`', () => {
      const productsField = Order.schema.obj.address;

      expect(productsField, 'у модели есть свойство address').to.be.not.undefined;
      expect(productsField.required, 'свойство address является обязательным').to.be.true;
      expect(productsField.type, 'тип свойства address - строка').to.be.equal(String);
    });

    it('должна содержать обязательное свойство `phone`', () => {
      const productsField = Order.schema.obj.phone;

      expect(productsField, 'у модели есть свойство phone').to.be.not.undefined;
      expect(productsField.required, 'свойство phone является обязательным').to.be.true;
      expect(productsField.type, 'тип свойства phone - строка').to.be.equal(String);
    });
  });

  describe('запрос POST /api/orders должен', () => {
    before((done) => {
      server = app.listen(port, done);
    });

    beforeEach(async () => {
      await cleanUpDB();
    });

    after(async () => {
      await cleanUpDB();
      server.close();
    });

    it('создать заказ в базе данных, если запрос сформирован корректно', async () => {
      const userData = {
        email: 'user@mail.com',
        displayName: 'user',
        password: '123123',
      };
      const token = 'token';
      await createUserAndSession(userData, token);

      const body = {
        products: [createObjectId()],
        phone: '1234567800',
        address: 'home',
      };

      const response = await request({
        method: 'post',
        url: serverURL,
        body,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });


      expect(response.body, 'тело ответа должно содержать id заказа').to.have.property('order');
      expect(response.body.order, 'id заказа должен быть валдиным ObjectId').to.satisfy(isObjectId);

      const order = await Order.findById(response.body.order);

      expect(order, 'созданный зказа должен быть в базе данных').to.be.not.undefined;
      expect(order.products, 'созданный заказ должен содержать список продуктов')
          .to.include(body.products[0]);
      expect(order.products, 'созданный заказ должен содержать только переданные продукты')
          .to.have.lengthOf(body.products.length);
      expect(order.phone, 'созданный заказ должен содержать переданный номер телефона')
          .to.be.equal(body.phone);
      expect(order.address, 'созданный заказ должен содержать переданный адресс')
          .to.be.equal(body.address);
    });

    it('использовать id авторизованного пользователя', async () => {
      const userData = {
        email: 'user@mail.com',
        displayName: 'user',
        password: '123123',
      };
      const token = 'token';
      const user = await createUserAndSession(userData, token);

      const body = {
        products: [createObjectId()],
        phone: '1234567800',
        address: 'home',
        user: [createObjectId()],
      };

      const response = await request({
        method: 'post',
        url: serverURL,
        body,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const order = await Order.findById(response.body.order);

      expect(order.user.toString(), 'id пользователя должен соответствовать авторизованому,' +
        'параметр в теле запроса должен быть проигнорирован').to.be.equal(user.id);
    });

    it('вернуть ошибку со статус кодом 400 и описанием ' +
      'ошибки валидации при неправильно сформированном запросе', async () => {
      const userData = {
        email: 'user@mail.com',
        displayName: 'user',
        password: '123123',
      };
      const token = 'token';
      await createUserAndSession(userData, token);

      const {statusCode, body} = await request({
        method: 'post',
        url: serverURL,
        body: {
          products: 'foo-bar',
        },
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(statusCode, 'статус код ответа должен быть 400').to.be.equal(400);
      expect(body, 'тело ответа должно содержать объект с ошибками').to.have.property('errors');
      expect(body.errors, 'products - ожидается получить массив').to.have.property('products')
          .that.include('Cast to Array failed');
      expect(body.errors, 'phone - свойство обязательно').to.have.property('phone')
          .that.include('required');
      expect(body.errors, 'address - свойство обязательно').to.have.property('address')
          .that.include('required');
    });

    it('вернуть ошибку со статусом 401 если пользователь не авторизован', async () => {
      const {statusCode} = await request({
        method: 'post',
        url: serverURL,
      });

      expect(statusCode, 'статус код ответа должен быть 401').to.be.equal(401);
    });
  });

  describe('запрос GET /api/orders должен', () => {
    before((done) => {
      server = app.listen(port, done);
    });

    beforeEach(async () => {
      await cleanUpDB();
    });

    after(async () => {
      await cleanUpDB();
      server.close();
    });

    it('вернуть перечень заказов текущего пользователя', async () => {
      const userData = {
        email: 'user@mail.com',
        displayName: 'user',
        password: '123123',
      };
      const token = 'token';
      const user = await createUserAndSession(userData, token);

      const categories = [
        {
          '_id': createObjectId('5d2f7e66a5a47618d7080a0f'),
          'title': 'Детские товары и игрушки',
          'subcategories': [
            {
              '_id': createObjectId('5d2f7e66a5a47618d7080a15'),
              'title': 'Прогулки и детская комната',
            },
          ],
        },
      ];

      await Category.insertMany(categories);

      const products = [
        {
          '_id': createObjectId('5d2f7e66a5a47618d7080a1f'),
          'title': 'Коляска Adamex Barletta 2 in 1',
          'description': 'description',
          'category': categories[0]._id,
          'subcategory': categories[0].subcategories[0]._id,
          'images': [
            'http://magazilla.ru/jpg_zoom1/598194.jpg',
          ],
          'price': 21230,
        },
        {
          '_id': createObjectId('5d2f7e66a5a47618d7080a2f'),
          'title': 'Коляска Peg Perego Si',
          'description': 'description',
          'category': categories[0]._id,
          'subcategory': categories[0].subcategories[0]._id,
          'images': [
            'http://magazilla.ru/jpg_zoom1/164281.jpg',
          ],
          'price': 15818,
        },
        {
          '_id': createObjectId('5d2f7e66a5a47618d7080a3f'),
          'title': 'Коляска Adamex Barletta 3 in 1',
          'description': 'description',
          'category': categories[0]._id,
          'subcategory': categories[0].subcategories[0]._id,
          'images': [
            'http://magazilla.ru/jpg_zoom1/1220903.jpg',
          ],
          'price': 26701,
        },
      ];

      await Product.insertMany(products);

      const orders = [
        {
          products: [products[0]._id],
          phone: '1234567800',
          address: 'home',
          user: [user.id],
        },
        {
          products: [products[1]._id],
          phone: '1234567800',
          address: 'home',
          user: [user.id],
        },
        // this order shouldn't be returned
        {
          products: [products[2]._id],
          phone: '1234567800',
          address: 'home',
          user: [createObjectId()],
        },
      ];

      await Order.insertMany(orders);

      const {body} = await request({
        method: 'get',
        url: serverURL,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(body, 'тело ответа должно быть массивом').to.be.a('array');
      expect(body, 'в ответе должно быть 2 заказа').to.have.lengthOf(2);
      expect(body, 'ответ должен содержать только заказы текущего пользователя')
          .to.satisfy(() => body.every((order) => order.user = user.id));
    });

    it('вернуть ошибку со статусом 401 если пользователь не авторизован', async () => {
      const {statusCode} = await request({
        method: 'post',
        url: serverURL,
      });

      expect(statusCode, 'статус код ответа должен быть 401').to.be.equal(401);
    });
  });
});
