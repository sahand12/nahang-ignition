const omit = require('lodash/omit');
const _private = {};

_private.serialize = function serialize(err) {
  try {
    return {
      id: err.id,
      status: err.statusCode,
      code: err.code || err.errorType,
      title: err.name,
      detail: err.message,
      meta: {
        context: err.context,
        help: err.help,
        errorDetails: err.errorDetails,
        level: err.level,
        errorType: err.errorType,
      },
    };
  }
  catch (err) {
    return {
      detail: 'Something went wrong.',
    };
  }
}

_private.deserialize = function deserialize(obj) {
  try {
    return {
      id: obj.id,
      message: obj.detail || obj['error_description'] || obj.message,
      statusCode: obj.status,
      code: obj.code || obj.error,
      level: obj.meta && obj.meta.level,
      help: obj.meta && obj.meta.help,
      context: obj.meta && obj.meta.context,
    };
  }
  catch (err) {
    return {
      message: 'something went wrong',
    };
  }
};

exports.isIgnitionError = function isIgnitionError(err) {
  const IgnitionName = this.IgnitionError.name;

  const recursiveIsIgnitionError = function recursiveIsIgnitionError(obj) {
    // No super constructor available any more
    if (!obj) {
      return false;
    }

    if (obj.name === IgnitionName) {
      return true;
    }

    return recursiveIsIgnitionError(obj.super_); // @FIXME obj.super_ or obj.__proto__
  }

  return recursiveIsIgnitionError(err.constructor);
}