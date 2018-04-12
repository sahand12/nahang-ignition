module.exports = {
  get errors() {
    return require('./lib/errors');
  },
  get config() {
    return require('./lib/config');
  },
  get logging() {
    return require('./lib/logging');
  },
  get debug() {
    return require('./lib/debug');
  },
  get server() {
    return require('./lib/server');
  }
};