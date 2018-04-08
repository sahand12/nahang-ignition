const each = require('lodash/each');
const upperFirst = require('lodash/upperFirst');
const toArray = require('lodash/toArray');
const isObject = require('lodash/isObject');
const bunyan = require('bunyan');
const fs = require('fs-extra');
const jsonStringifySafe = require('json-stringify-safe');
const PrettyStream = require('./PrettyStream');

class Logger {
  constructor({
    env = 'development',
    domain = 'localhost',
    transports = ['stdout'],
    level = 'info',
    mode = 'short',
    path = process.cwd(),
    loggly = {},
  }) {
    this.env = env;
    this.domain = domain;
    this.transports = transports;
    this.level = process.env.LEVEL || level;
    this.mode = process.env.MODE || mode;
    this.path = path;
    this.loggly = loggly;

    // stdout has to be on the first position in the transport, because if the Logger itself
    // logs, you won't see the stdout print
    if (this.transports.includes('stdout') && this.transports.indexOf('stdout') !== 0) {
      this.transports.splice(this.transports.indexOf('stdout'), 1);
      this.transports = ['stdout'].concat(this.transports);
    }

    // Special env variable to enable long mode and level info
    if (process.)
  }
}