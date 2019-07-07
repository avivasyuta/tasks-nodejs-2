module.exports = {
  mongodb: {
    uri: (process.env.NODE_ENV === 'test'
      ? 'mongodb://localhost/6-module-3-task-test'
      : 'mongodb://localhost/6-module-3-task'),
  },
};
