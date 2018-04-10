const utils = require('./utils');
const debug = require('debug');

module.exports = function initDebug(name) {
  const parentPath = utils.getCallerRoot();
  let alias;
  let pkg;

  try {
    pkg = require(`${parentPath}/package.json`);
    alias = typeof pkg.alias !== 'undefined' ? pkg.alias : pkg.name;
  }
  catch (err) {
    alias = 'undefined';
  }

  return debug(`${alias}:${name}`);
};

module.exports._base = debug;