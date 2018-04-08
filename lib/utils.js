const findRoot = require('find-root');
const caller = require('caller');

/**
 * getCallerRoot
 *
 * Used by debug,
 * Because we want to find the root (where a package.json) nearest to the
 * calling module. so that debug messages are output relative to the CALLER
 * module
 *
 */
exports.getCallerRoot = function getCallerRoot() {
  try {
    return findRoot(caller(2));
  }
  catch (err) {
    return;
  }
};

exports.getCWDRoot = function getCWDRoot() {
  try {
    return findRoot(process.cwd());
  }
  catch (err) {
    return;
  }
};