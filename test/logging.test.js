const PrettyStream = require('../lib/logging/PrettyStream');
const Logger = require('../lib/logging/Logger');
const {Writable} = require('stream');
const sinon = require('sinon');
const should = require('should');
const bunyan2Loggly = require('bunyan-loggly');
const errors = require('../lib/errors');

const sandbox = sinon.sandbox.create();