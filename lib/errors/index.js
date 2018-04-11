const uuid = require('uuid');
const isString = require('lodash/isString');

const utils = require('./utils');

class IgnitionError extends Error {
  constructor(options = {}) {
    super(options);
    const self = this;

    if (isString(options)) {
      throw new Error('Please instantiate Errors with the option pattern. e.g. new errors.IgnitionError({message: ...})');
    }

    Error.captureStackTrace(this, IgnitionError);

    /**
     * Defaults
     */
    this.statusCode = 500;
    this.errorType = 'InternalServerError';
    this.level = 'normal';
    this.message = 'The server has encountered an error.';
    this.id = uuid.v1();

    /**
     * Custom overrides
     */
    this.id = options.id || this.id;
    this.statusCode = options.statusCode || this.statusCode;
    this.level = options.level || this.level;
    this.context = options.context || this.context;
    this.help = options.help || this.help;
    this.errorType = this.name = options.errorType || this.errorType;
    this.errorDetails = options.errorDetails || this.errorDetails;
    this.code = options.code || null;
    this.property = options.property || null;
    this.redirect = options.redirect || null;

    this.message = options.message || this.message;
    this.hideStack = options.hideStack;

    // error to inherit from, override!
    // nested objects are getting copied over in one piece (can be changed, but not needed right now)
    // support err as string (it happens that third party libs return a string instead of an error instance)
    if (options.err) {
      if (isString(options.err)) {
        options.err = new Error(options.err);
      }
      const properties = ['errorType', 'name', 'statusCode', 'message', 'level'];
      Object.getOwnPropertyNames(options.err)
        .forEach(prop => {
          if (properties.includes(prop)) {
            return;
          }

          if (prop === 'stack') {
            self[prop] += `\n\n${options.err[prop]}` ;
            return;
          }

          self[prop] = options.err[prop] || self[prop];
        });
    }
  }
}

const assign = Object.assign;
const errors = {
  
  IgnitionError,
  
  InternalServerError: class InternalServerError extends IgnitionError {
    constructor(options) {
      super(assign({
        statusCode: 500,
        level: 'critical',
        errorType: 'InternalServerError',
        message: 'The server has encountered an error.',
      }, options));
    }
  },
  IncorrectUsageError: class IncorrectUsageError extends IgnitionError {
    constructor(options) {
      super(assign({
        statusCode: 400,
        level: 'critical',
        errorType: 'IncorrectUsageError',
        message: 'We detected a misuse. Please read the stack trace.',
      }, options));
    }
  },
  NotFoundError: class NotFoundError extends IgnitionError {
    constructor(options) {
      super(assign({
        statusCode: 404,
        errorType: 'NotFoundError',
        message: 'Resource could not be found.',
      }, options));
    }
  },
  BadRequestError: class BadRequestError extends IgnitionError {
    constructor(options) {
      super(assign({
        statusCode: 400,
        errorType: 'BadRequestError',
        message: 'The request could not be understood.',
      }, options));
    }
  },
  UnauthorizedError: class UnauthorizedError extends IgnitionError {
    constructor(options) {
      super(assign({
        statusCode: 401,
        errorType: 'UnauthorizedError',
        message: 'You are not authorized to make this request.',
      }, options));
    }
  },
  NoPermissionError: class NoPermissionError extends IgnitionError {
    constructor(options) {
      super(assign({
        statusCode: 403,
        errorType: 'NoPermissionError',
        message: 'You do not have permission to perform this request.',
      }, options));
    }
  },
  ValidationError: class ValidationError extends IgnitionError {
    constructor(options) {
      super(assign({
        statusCode: 422,
        errorType: 'ValidationError',
        message: 'The request failed validation.',
      }, options));
    }
  },
  UnsupportedMediaTypeError: class UnsupportedMediaTypeError extends IgnitionError {
    constructor(options) {
      super(assign({
        statusCode: 415,
        errorType: 'UnsupportedMediaTypeError',
        message: 'The media in the request is not supported by the server.',
      }, options));
    }
  },
  TooManyRequestsError: class TooManyRequestsError extends IgnitionError {
    constructor(options) {
      super(assign({
        statusCode: 429,
        errorType: 'TooManyRequestsError',
        message: 'The server has received too many similar requests in a short space of time.',
      }, options));
    }
  },
  MaintenanceError: class MaintenanceError extends IgnitionError {
    constructor(options) {
      super(assign({
        statusCode: 503,
        errorType: 'MaintenanceError',
        message: 'The request could not be understood.',
      }, options));
    }
  },
  MethodNotAllowedError: class MethodNotAllowedError extends IgnitionError {
    constructor(options) {
      super(assign({
        statusCode: 405,
        errorType: 'MethodNotAllowedError',
        message: 'Method not allowed for resource.',
      }, options));
    }
  },
  RequestEntityTooLargeError: class RequestEntityTooLargeError extends IgnitionError {
    constructor(options) {
      super(assign({
        statusCode: 413,
        errorType: 'RequestEntityTooLargeError',
        message: 'Request was too big for the server to handle.',
      }, options));
    }
  },
  TokenRevocationError: class TokenRevocationError extends IgnitionError {
    constructor(options) {
      super(assign({
        statusCode: 503,
        errorType: 'TokenRevocationError',
        message: 'Token is no longer available.',
      }, options));
    }
  },
  VersionMismatchError: class VersionMismatchError extends IgnitionError {
    constructor(options) {
      super(assign({
        statusCode: 400,
        errorType: 'VersionMismatchError',
        message: 'Requested version does not match server version',
      }, options));
    }
  },
};

module.exports = errors;

module.exports.utils = {
  // serialize: utils.serialize.bind(errors),
  // deserialize: utils.deserialize.bind(errors),
  isIgnitionError: utils.isIgnitionError.bind(errors),
};