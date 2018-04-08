const Logger = require('./Logger');

module.exports = function createNewInstance(options = {}) {
  const {
    domain,
    env,
    mode,
    level,
    transports,
    rotation,
    path,
    loggly,
  } = options;

  return new Logger({
    domain,
    env,
    mode,
    level,
    transports,
    rotation,
    path,
    loggly,
  });
};

module.exports.Logger = Logger;