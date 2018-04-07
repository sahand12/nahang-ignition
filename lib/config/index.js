const nconf = require('nconf');
const fs = require('fs');
const path = require('path');
const utils = require('../utils');
let config;

const setupConfig = function setupConfig() {
  const env = require('./env'); // env.js file
  const defaults = {};
  const parentPath = utils.getCWDRoot();

  config = new nconf.Provider();

  if (parentPath && fs.existsSync(path.join(parentPath, 'config.example.json'))) {
    defaults = require(path.join(parentPath, 'config.example.json'));
  }

  config
    .argv() // first command line options
    .env() // environment variable
    .file({
      file: path.join(parentPath, `config.${env}.json`), // config.development.json | config.production.json
    });

  config.set('env', env);
  config.defaults(defaults);
};

/**
 * The config object is cached, once it has been setup with the parent
 * @param {boolean} noCache - Used for tests only, to reinit the cache on every call.
 */
module.exports = function initConfig(noCache) {
  if (!config || noCache) {
    setupConfig();
  }

  return config;
}