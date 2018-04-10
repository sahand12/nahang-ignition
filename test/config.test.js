// Test Requirements
const {expect} = require('chai');
const sinon = require('sinon');
const {join} = require('path');

const initConfig = require('../lib/config');

const sandbox = sinon.sandbox.create();