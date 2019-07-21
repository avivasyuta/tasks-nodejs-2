module.exports.me = async function me(ctx) {
  ctx.body = {me: {
    email: ctx.user.email,
    displayName: ctx.user.displayName,
  }};
};
