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
    rotation = {
      enabled: false,
      period: '1w',
      count: 100,
    },
    loggly = {},
  }) {
    this.env = env;
    this.domain = domain;
    this.transports = transports;
    this.level = process.env.LEVEL || level;
    this.mode = process.env.MODE || mode;
    this.path = path;
    this.rotation = rotation;
    this.loggly = loggly;

    // stdout has to be on the first position in the transport, because if the Logger itself
    // logs, you won't see the stdout print
    if (this.transports.includes('stdout') && this.transports.indexOf('stdout') !== 0) {
      this.transports.splice(this.transports.indexOf('stdout'), 1);
      this.transports = ['stdout'].concat(this.transports);
    }

    // Special env variable to enable long mode and level info
    if (process.env.LION) {
      this.level = 'info';
      this.mode = 'long';
    }

    // ensure we have a trailing slash
    if (!this.path.match(/\/$|\\$/)) {
      this.path = this.path + '/';
    }

    this.streams = {};
    this.serializers = [];
    this.setSerializers();

    if (this.transports.includes('stderr') && !this.transports.includes('stdout')) {
      this.transports.unshift('stdout'); // @TODO: make a PR to ignition
    }

    this.transports.forEach(transport => {

      // for example: setStdoutStream | setStdErrorStream | ...
      let transportFn = `set${upperFirst(transport)}Stream`;

      if (!this[transportFn]) {
        throw new Error(`${upperFirst(transport)} is an invalid transport`);
      }

      this[transportFn]();
    });
  }

  setStdoutStream() {
    let prettyStdout = new PrettyStream({
      mode: this.mode,
    });

    prettyStdout.pipe(process.stdout);

    this.streams.stdout = {
      name: 'stdout',
      log: bunyan.createLogger({
        name: 'Log',
        streams: [{
          // the write method is given raw log record objects instead of a
          // JOSN-stringified string. This can be useful for hooking on
          // further processing to all Bunyan logging.
          type: 'raw',
          stream: prettyStdout,
          level: this.level,
        }],
        serializers: this.serializers,
      }),
    };
  }

  setStderrStream() {
    const PrettyStderr = new PrettyStream({
      mode: this.mode,
    });

    PrettyStderr.pipe(process.stderr);

    this.streams.stderr = {
      name: 'stderr',
      log: bunyan.createLogger({
        name: 'Log',
        streams: [{
          type: 'raw',
          stream: PrettyStderr,
          level: 'error',
        }],
        serializers: this.serializers,
      }),
    };
  }

  setLogglyStream() {

  }

  /**
   * By default we log into two files
   * 1. file-errors: all errors only
   * 2. file-all: everything
   */
  setFileStream() {
    // e.g.: https://my-domain.com --> http__my_domain_com
    let sanitizedDomain = this.domain.replace(/[^\w]/gi, '_');

    // CASE: target log folder does not exist, show warning
    if (!fs.pathExistsSync(this.path)) {
      this.error('Target log folder does not exist: ' + this.path);
      return;
    }

    this.streams['file-errors'] = {
      name: 'file',
      log: bunyan.createLogger({
        name: 'Log',
        streams: [{
          path: `${this.path}${sanitizedDomain}_${this.env}.error.log`,
          level: 'error',
        }],
        serializers: this.serializers,
      })
    };

    this.streams['file-all'] = {
      name: 'file',
      log: bunyan.createLogger({
        name: 'Log',
        streams: [{
          path: `${this.path}${sanitizedDomain}_${this.env}.log`,
          level: this.level,
        }],
        serializers: this.serializers,
      }),
    };

    if (this.rotation.enabled) {
      this.streams['rotation-errors'] = {
        name: 'rotation-errors',
        log: bunyan.createLogger({
          name: 'Log',
          streams: [{
            type: 'rotation-file',
            path: `${this.path}${sanitizedDomain}_${this.env}.error.log`,
            period: this.rotation.period,
            count: this.rotation.count,
            level: 'error',
          }],
          serializers: this.serializers,
        }),
      };

      this.streams['rotation-all'] = {
        name: 'rotation-all',
        log: bunyan.createLogger({
          name: 'Log',
          streams: [{
            type: 'rotation-file',
            path: `${this.path}${sanitizedDomain}_${this.env}.log`,
            period: this.rotation.period,
            count: this.rotation.count,
            level: this.level,
          }],
          serializers: this.serializers,
        }),
      };
    }
  }

  // Considerations for serializers functions: (https://github.com/trentm/node-bunyan)
  // 1. A serializer function should never throw
  // 2. A serializer function should never mutate the given object. Doing so will change the object in your application.
  // 3. A serializer function should be defensive.
  setSerializers() {
    this.serializers = {
      req: req => {
        if (!req) { return false; }
        return {
          meta: {
            requestId: req.requestId,
            userId: req.userId,
          },
          url: req.url,
          method: req.method,
          originalUrl: req.originalUrl,
          params: req.params,
          headers: this.removeSensitiveData(req.headers),
          body: this.removeSensitiveData(req.body),
          // Account for native and queryParser plugin usage
          query: (typeof query === 'function')
            ? this.removeSensitiveData(req.query())
            : this.removeSensitiveData(req.query),
        };
      },
      res: res => {
        if (!res) { return false; }
        return {
          _headers: this.removeSensitiveData(res._headers), // use res.getHeaders() https://nodejs.org/api/http.html#http_response_getheaders
          statusCode: res.statusCode,
          responseTime: res.responseTime,
        };
      },
      err: err => {
        if (!err) { return false; }
        return {
          id: err.id,
          domain: this.domain,
          code: err.code,
          name: err.errorType,
          statusCode: err.statusCode,
          level: err.level,
          message: err.message,
          context: err.context,
          help: err.help,
          stack: err.stack,
          hideStack: err.hideStack,
          errorDetails: err.errorDetails,
        }
      },
    };
  }

  removeSensitiveData(obj) {
    let newObj = {};

    each(obj, (value, key) => {
      try {
        if (isObject(value)) {
          value = this.removeSensitiveData(value);
        }

        if (!key.match(/pin|password|authorization|cookie/gi)) {
          newObj[key] = value;
        }
      }
      catch (err) {
        newObj[key] = value;
      }
    });
    return newObj;
  }

  /**
   * Because arguments can contain lot's of different things, we prepare the
   * arguments here.
   * This function allows us to use logging very flexible
   *
   * logging.info('HEY', 'DU') --> is one string
   * logging.info({}, {}); --> is one object
   * logging.error(new Error()) --> is {err: new Error()}
   */
  log(type, args) {
    let modifiedArguments;

    each(args, value => {
      if (value instanceof Error) {
        if (!modifiedArguments) {
          modifiedArguments = {};
        }
        modifiedArguments.err = value;
      }
      else if (isObject(value)) {
        if (!modifiedArguments) {
          modifiedArguments = {};
        }
        const keys = Object.keys(value);
        each(keys, (key => {
          modifiedArguments[key] = value[key];
        }));
      }
      else {
        if (!modifiedArguments) {
          modifiedArguments = '';
        }
        modifiedArguments += value;
        modifiedArguments += ' ';
      }
    });

    each(this.streams, logger => {
      // If we have both a stdout and a stderr stream, don't log errors to stdout
      // because it would result in duplicate logs
      if (type === 'error' && logger.name === 'stdout' && this.transports.includes('stderr')) {
        return;
      }

      /**
       * @Note
       * Only `loggly` offers the `match` option.
       * And currently `loggly` is by default configured to only send errors (not configurable)
       * e.g. level/info would be ignored
       *
       * @Note
       * The `match` feature is not completed. we hardcode checking if the level/type is
       * `error` for now.
       * Otherwise each `level:info` would hav to run through the matching logic.
       *
       * @Note
       * Matching a string in the whole req/res object massively slows down the process,
       * because it's a sync operation.
       *
       * If we want to extend the feature, we can only offer matching certain keys
       * e.g. status code, headers.
       * If we want to extend the feature, we have to do proper performance testing.
       *
       * `jsStringifySafe` can match a string in an object, which has circular dependencies
       * (https://github.com/moll/json-stringify-safe)
       */
      if (logger.match && type === 'error') {
        const isMatch = new RegExp(logger.match)
          .test(jsonStringifySafe(modifiedArguments.err || null).replace(/"/g, ''));
        if (isMatch) {
          logger.log[type](modifiedArguments);
        }
      }
      else {
        logger.log[type](modifiedArguments);
      }
    });
  }

  info(...args) {
    this.log('info', args);
  }
  warn(...args) {
    this.log('warn', args);
  }
  error(...args) {
    this.log('error', args);
  }
}

module.exports = Logger;