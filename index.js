module.exports = {
  get errors() {
    return require('./lib/errors');
  },
  get config() {
    return require('./lib/config');
  },
  get logging() {
    return require('./lib/logging');
  }
}